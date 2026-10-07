import assert from 'node:assert/strict'
import Module from 'node:module'

// In-memory adapter: never contacts Firebase or deletes user data.
const records = new Map<string, Record<string, any>>()
const events: string[] = []
let failWrite = false
let failStorage = false
let failPath: string | null = null
let authenticatedUser = 'owner'
function ref(path: string): any {
  const parts = path.split('/')
  return {
    path, id: parts.at(-1), parent: { parent: parts.length > 2 ? { id: parts.at(-3) } : null },
    collection: (name: string) => collection(`${path}/${name}`),
    get: async () => snapshot(path),
    update: async (data: Record<string, any>) => {
      const current = records.get(path)!
      for (const [key, value] of Object.entries(data)) {
        if (key === 'activeMutations') current[key] = typeof value === 'number' ? value : Number(current[key] || 0) + Number(value.operand)
        else if (key === 'workspaceIds') current[key] = current[key].filter((id: string) => id !== 'box')
        else current[key] = value
      }
      events.push(`update:${path}`)
    },
    delete: async () => { records.delete(path); events.push(`delete:${path}`) },
    listCollections: async () => Array.from(new Set([...records.keys()].filter(key => key.startsWith(`${path}/`)).map(key => key.slice(path.length + 1).split('/')[0]))).map(name => collection(`${path}/${name}`)),
  }
}
function snapshot(path: string): any { return { exists: records.has(path), id: path.split('/').at(-1), data: () => records.get(path), ref: ref(path) } }
function collection(path: string): any {
  return {
    path, doc: (id: string) => ref(`${path}/${id}`),
    get: async () => { const docs = [...records.keys()].filter(key => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1).map(key => snapshot(key)); return { docs, size: docs.length } },
    where: (field: string, operator: string, value: string) => ({ get: async () => ({ docs: [...records.entries()].filter(([key, data]) => key.startsWith(`${path}/`) && key.split('/').length === path.split('/').length + 1 && (operator === 'array-contains' ? data[field]?.includes(value) : data[field] === value)).map(([key]) => snapshot(key)) }) }),
  }
}
const fakeDb = {
  collection,
  runTransaction: async (callback: any) => callback({ get: (target: any) => target.get(), update: (target: any, data: any) => { void target.update(data) }, create: (target: any, data: any) => { records.set(target.path, data) }, delete: (target: any) => { records.delete(target.path) } }),
  bulkWriter: () => ({ update: (target: any, data: any) => failWrite ? Promise.reject(new Error('write failed')) : target.update(data), delete: (target: any) => failWrite || target.path === failPath ? Promise.reject(new Error('write failed')) : target.delete(), close: async () => {} }),
  recursiveDelete: async (target: any) => { for (const key of records.keys()) if (key.startsWith(`${target.path}/`)) records.delete(key); events.push(`recursive:${target.path}`) },
}
const originalRequire = (Module.prototype as any).require
;(Module.prototype as any).require = function(id: string) {
  if (id === 'server-only') return {}
  if (id === './firebase' || id === '@/app/lib/firebase') return { db: fakeDb, storage: { deleteFiles: async ({ prefix }: any) => { if (failStorage) throw new Error('storage failed'); events.push(`storage:${prefix}`) } } }
  if (id === '@/app/lib/auth') return { auth: async () => authenticatedUser ? { user: { id: authenticatedUser } } : null }
  return originalRequire.call(this, id)
}

async function main() {
  const { deleteWorkspace, WorkspaceDeletionError } = await import('../app/lib/delete-workspace')
  const { withWorkspaceMutation } = await import('../app/api/utils/with-workspace-mutation')
  const seed = () => {
    records.clear(); events.length = 0; failWrite = false; failStorage = false; failPath = null; authenticatedUser = 'owner'
    records.set('workspaces/box', { name: 'Teste', ownerId: 'owner', members: ['owner', 'member'] })
    records.set('workspaces/box/banks/bank', { name: 'Banco' })
    records.set('workspaces/box/debits/debit', { value: 42 })
    records.set('workspaces/other', { name: 'Outra' })
    records.set('workspaces/other/debits/debit', { value: 10 })
    records.set('users/owner', { workspaceIds: ['box', 'other'] })
    records.set('users/member', { workspaceIds: ['box'] })
    records.set('invitations/invite', { workspaceId: 'box' })
    records.set('_emailOutbox/workspace-invitation:invite', {})
    records.set('users/member/notifications/notice', { workspaceId: 'box' })
    records.set('_pushOutbox/member_notice', {})
    records.set('users/former', { workspaceIds: [] })
    records.set('users/former/notifications/removed', { workspaceId: 'box' })
    records.set('users/invitee', { workspaceIds: [] })
    records.set('users/invitee/notifications/invited', { workspaceId: 'box' })
  }
  for (const [user, name, status] of [['member', 'Teste', 403], ['outsider', 'Teste', 403], ['owner', 'teste', 400], ['owner', null, 400]] as const) {
    seed()
    await assert.rejects(deleteWorkspace('box', user, name), error => error instanceof WorkspaceDeletionError && error.status === status)
    assert.equal(events.length, 0)
  }
  seed(); records.delete('workspaces/box')
  await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), error => error instanceof WorkspaceDeletionError && error.status === 404)
  seed(); failWrite = true
  await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), /write failed/)
  assert.equal(records.get('workspaces/box')?.deleting, true)
  assert(records.has('workspaces/box/debits/debit'))
  failWrite = false; await deleteWorkspace('box', 'owner', 'Teste')
  assert(!records.has('workspaces/box'))
  for (const [outbox, source] of [['_emailOutbox/workspace-invitation:invite', 'invitations/invite'], ['_pushOutbox/member_notice', 'users/member/notifications/notice']]) {
    seed(); failPath = outbox
    await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), /write failed/)
    assert(records.has(source), 'Keep discovery records until outbox deletion succeeds')
    failPath = null
    await deleteWorkspace('box', 'owner', 'Teste')
    assert(!records.has(outbox))
  }
  seed(); failStorage = true
  await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), /storage failed/)
  assert(records.has('workspaces/box'))
  failStorage = false; await deleteWorkspace('box', 'owner', 'Teste')
  assert(![...records.keys()].some(key => key.startsWith('workspaces/box')))
  assert(records.has('workspaces/other/debits/debit'))
  assert.deepEqual(records.get('users/owner')?.workspaceIds, ['other'])
  assert(!records.has('invitations/invite'))
  assert(!records.has('_emailOutbox/workspace-invitation:invite'))
  assert(!records.has('users/member/notifications/notice'))
  assert(!records.has('users/former/notifications/removed'))
  assert(!records.has('users/invitee/notifications/invited'))
  assert(events.includes('storage:proofs/box/'))
  assert(events.includes('storage:bank_icons/box/'))

  seed()
  const context = { params: Promise.resolve({ workspaceId: 'box' }) }
  const wrapped = withWorkspaceMutation(async () => {
    assert.equal(records.get('workspaces/box')?.activeMutations, 1)
    await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), error => error instanceof WorkspaceDeletionError && error.status === 409)
    return new Response('ok')
  })
  assert.equal((await wrapped(new Request('http://localhost'), context)).status, 200)
  assert.equal(records.get('workspaces/box')?.activeMutations, 0)
  await deleteWorkspace('box', 'owner', 'Teste')
  assert.equal((await wrapped(new Request('http://localhost'), context)).status, 403)
  seed(); records.get('workspaces/box')!.deleting = true
  assert.equal((await wrapped(new Request('http://localhost'), context)).status, 403)
  seed(); authenticatedUser = ''
  assert.equal((await wrapped(new Request('http://localhost'), context)).status, 401)
  seed()
  await assert.rejects(withWorkspaceMutation(async () => { throw new Error('handler failed') })(new Request('http://localhost'), context), /handler failed/)
  assert.equal(records.get('workspaces/box')?.activeMutations, 0)
  seed(); records.get('workspaces/box')!.activeMutations = 1
  records.set('workspaces/box/mutationLeases/completed', { status: 'finished' })
  await deleteWorkspace('box', 'owner', 'Teste')
  assert(!records.has('workspaces/box'))
  seed(); records.get('workspaces/box')!.activeMutations = 1
  records.set('workspaces/box/mutationLeases/remote', { status: 'running', hostname: 'another-server', pid: 1 })
  await assert.rejects(deleteWorkspace('box', 'owner', 'Teste'), error => error instanceof WorkspaceDeletionError && error.status === 409)
  console.log('Workspace deletion tests passed: authorization, confirmation, cleanup, retries, isolation and concurrent mutations.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
