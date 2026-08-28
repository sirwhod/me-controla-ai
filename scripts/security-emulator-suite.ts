import Module from 'node:module'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('Security suite requires FIRESTORE_EMULATOR_HOST and refuses to run against a real project.')
}

const originalRequire = (Module.prototype as unknown as { require: (id: string) => unknown }).require
;(Module.prototype as unknown as { require: (id: string) => unknown }).require = function (id: string) {
  if (id === 'server-only') return {}
  return originalRequire.call(this, id)
}

async function main() {
const { db, storage } = await import('../app/lib/firebase')
const { checkIsWorkspaceMember } = await import('../app/api/utils/check-is-workspace-member')
const { processInvitationAction, InvitationError } = await import('../app/lib/invitations')
const { consumeRateLimit } = await import('../app/lib/rate-limit')

const runId = `security-${Date.now()}-${Math.random().toString(16).slice(2)}`
const ownerId = `${runId}-owner`
const memberId = `${runId}-member`
const outsideId = `${runId}-outside`
const workspaceId = `${runId}-workspace`
const workspaceRef = db.collection('workspaces').doc(workspaceId)
const results: Array<{ name: string; passed: boolean; detail?: string }> = []

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail: condition ? undefined : detail })
}

async function expectInvitationError(name: string, operation: Promise<unknown>, status: number) {
  try {
    await operation
    assert(name, false, `esperava status ${status}, mas a operação passou`)
  } catch (error) {
    assert(name, error instanceof InvitationError && error.status === status, String(error))
  }
}

try {
  await Promise.all([
    db.collection('users').doc(ownerId).set({ email: `${ownerId}@example.test`, workspaceIds: [workspaceId] }),
    db.collection('users').doc(memberId).set({ email: `${memberId}@example.test`, workspaceIds: [workspaceId] }),
    db.collection('users').doc(outsideId).set({ email: `${outsideId}@example.test`, workspaceIds: [] }),
    workspaceRef.set({ ownerId, members: [ownerId, memberId], type: 'shared' }),
  ])

  assert('owner acessa workspace', await checkIsWorkspaceMember({ workspaceId, userId: ownerId }))
  assert('membro ativo acessa workspace', await checkIsWorkspaceMember({ workspaceId, userId: memberId }))
  assert('outro workspace é negado', !(await checkIsWorkspaceMember({ workspaceId, userId: outsideId })))

  await workspaceRef.update({ members: [ownerId] })
  assert(
    'membro removido é revogado mesmo com workspaceIds antigo',
    !(await checkIsWorkspaceMember({ workspaceId, userId: memberId, workspaceIds: [workspaceId] })),
  )

  const wrongEmailInvite = db.collection('invitations').doc(`${runId}-wrong-email`)
  await wrongEmailInvite.set({
    workspaceId, workspaceName: 'Test', inviteeEmail: 'target@example.test', status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
  })
  await expectInvitationError(
    'convite de outro e-mail é negado',
    processInvitationAction({ invitationId: wrongEmailInvite.id, action: 'accept', userId: memberId, userEmail: 'other@example.test' }),
    403,
  )

  const expiredInvite = db.collection('invitations').doc(`${runId}-expired`)
  await expiredInvite.set({
    workspaceId, workspaceName: 'Test', inviteeEmail: `${memberId}@example.test`, status: 'pending',
    expiresAt: new Date(Date.now() - 1_000),
  })
  await expectInvitationError(
    'convite expirado é negado',
    processInvitationAction({ invitationId: expiredInvite.id, action: 'accept', userId: memberId, userEmail: `${memberId}@example.test` }),
    410,
  )

  const concurrentInvite = db.collection('invitations').doc(`${runId}-concurrent`)
  await concurrentInvite.set({
    workspaceId, workspaceName: 'Test', inviteeEmail: `${memberId}@example.test`, status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
  })
  const concurrent = await Promise.allSettled([
    processInvitationAction({ invitationId: concurrentInvite.id, action: 'accept', userId: memberId, userEmail: `${memberId}@example.test` }),
    processInvitationAction({ invitationId: concurrentInvite.id, action: 'accept', userId: memberId, userEmail: `${memberId}@example.test` }),
  ])
  assert('aceite concorrente tem exatamente um sucesso', concurrent.filter((item) => item.status === 'fulfilled').length === 1)

  await workspaceRef.update({ members: [ownerId] })
  await expectInvitationError(
    'replay de convite aceito não readiciona membro removido',
    processInvitationAction({ invitationId: concurrentInvite.id, action: 'accept', userId: memberId, userEmail: `${memberId}@example.test` }),
    409,
  )
  assert('replay mantém membro revogado', !(await checkIsWorkspaceMember({ workspaceId, userId: memberId })))

  const limiterResults = await Promise.all(
    Array.from({ length: 6 }, () => consumeRateLimit('security-suite', runId, 5, 60_000)),
  )
  assert('rate limit distribuído permite apenas o limite', limiterResults.filter((item) => item.allowed).length === 5)
  assert('rate limit distribuído bloqueia excedente', limiterResults.filter((item) => !item.allowed).length === 1)

  const legacyBankRef = workspaceRef.collection('banks').doc(`${runId}-legacy-bank`)
  const legacyObjectPath = `bank_icons/${workspaceId}/legacy.png`
  await legacyBankRef.set({
    name: 'Legacy',
    iconUrl: `https://storage.googleapis.com/demo-me-controla-ai.appspot.com/${legacyObjectPath}?X-Goog-Signature=masked`,
  })
  const tsxCli = path.resolve('node_modules/tsx/dist/cli.mjs')
  const dryRun = spawnSync(process.execPath, [tsxCli, 'scripts/migrate-legacy-storage-urls.ts'], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: false,
  })
  assert('migração dry-run executa sem escrita', dryRun.status === 0 && dryRun.stdout.includes('"eligible":1'), dryRun.stderr)
  assert('dry-run preserva URL legada', Boolean((await legacyBankRef.get()).data()?.iconUrl))

  const migrationApply = spawnSync(process.execPath, [tsxCli, 'scripts/migrate-legacy-storage-urls.ts', '--apply'], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8', shell: false,
  })
  const migratedBank = (await legacyBankRef.get()).data()
  assert('migração apply executa no Emulator', migrationApply.status === 0 && migrationApply.stdout.includes('"migrated":1'), migrationApply.stderr)
  assert('migração troca URL por path privado', migratedBank?.iconPath === legacyObjectPath && migratedBank?.iconUrl === null)

  const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST
  if (storageHost) {
    const bucket = process.env.FIREBASE_STORAGE_BUCKET || 'demo-me-controla-ai.appspot.com'
    const objectPath = `bank_icons/${workspaceId}/secret.png`
    await storage.file(objectPath).save(Buffer.from([0x89, 0x50, 0x4e, 0x47]), { metadata: { contentType: 'image/png' } })
    const response = await fetch(`http://${storageHost}/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media`)
    assert('Storage nega leitura direta de objeto existente', response.status === 401 || response.status === 403, `status ${response.status}`)
    await storage.file(objectPath).delete({ ignoreNotFound: true })
  } else {
    assert('Storage emulator configurado', false, 'FIREBASE_STORAGE_EMULATOR_HOST ausente')
  }
} finally {
  await Promise.allSettled([
    db.recursiveDelete(workspaceRef),
    db.collection('users').doc(ownerId).delete(),
    db.collection('users').doc(memberId).delete(),
    db.collection('users').doc(outsideId).delete(),
    db.collection('invitations').doc(`${runId}-wrong-email`).delete(),
    db.collection('invitations').doc(`${runId}-expired`).delete(),
    db.collection('invitations').doc(`${runId}-concurrent`).delete(),
  ])
}

for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`)
}
const failed = results.filter((result) => !result.passed)
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length }))
if (failed.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
