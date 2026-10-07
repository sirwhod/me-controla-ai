import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import Module from 'node:module'
import dotenv from 'dotenv'

// Opt-in only. Creates new disposable fixtures; never deletes existing workspaces.
if (process.env.RUN_WORKSPACE_DELETION_PREVIEW !== 'true') throw new Error('Set RUN_WORKSPACE_DELETION_PREVIEW=true to test the localhost preview.')
dotenv.config({ path: ['.env.local', '.env'], quiet: true })
const originalRequire = (Module.prototype as any).require
;(Module.prototype as any).require = function(id: string) { return id === 'server-only' ? {} : originalRequire.call(this, id) }

async function main() {
  const { db, storage } = await import('../app/lib/firebase')
  const { FieldValue } = await import('firebase-admin/firestore')
  const { encode } = await import('next-auth/jwt')
  const base = 'http://localhost:3000'
  const cookies = new Map<string, string>()
  async function request(path: string, init: RequestInit = {}, overrideCookie?: string) {
    const response = await fetch(`${base}${path}`, { ...init, redirect: 'manual', headers: { ...init.headers, cookie: overrideCookie ?? [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') } })
    if (overrideCookie === undefined) for (const raw of response.headers.getSetCookie()) {
      const pair = raw.split(';')[0]; const index = pair.indexOf('='); cookies.set(pair.slice(0, index), pair.slice(index + 1))
    }
    return response
  }
  const instructions = readFileSync('AGENTS.md', 'utf8')
  const email = instructions.match(/E-mail: `([^`]+)`/)?.[1]
  const password = instructions.match(/Senha: `([^`]+)`/)?.[1]
  assert(email && password, 'Authorized local test credentials must exist in AGENTS.md')
  const csrfResponse = await request('/api/auth/csrf')
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string }
  const login = await request('/api/auth/callback/credentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email, password, csrfToken, callbackUrl: `${base}/dashboard` }) })
  assert([200, 302].includes(login.status), 'Local login request failed')
  const session = await (await request('/api/auth/session')).json() as { user?: { id: string } }
  assert(session.user?.id, 'Local login did not produce a session')
  const ownerId = session.user.id
  const baselineResponse = await request('/api/workspaces')
  assert.equal(baselineResponse.status, 200)
  const baseline = await baselineResponse.json() as Array<{ id: string }>
  const id = `test-delete-${randomUUID()}`
  const memberId = `${id}-member`
  const workspace = db.collection('workspaces').doc(id)
  const member = db.collection('users').doc(memberId)
  const owner = db.collection('users').doc(ownerId)
  const name = `Caixinha descartável ${id}`
  const proof = `proofs/${id}/fixture`
  const icon = `bank_icons/${id}/fixture`
  const invitation = db.collection('invitations').doc(id)
  const emailJob = db.collection('_emailOutbox').doc(`workspace-invitation:${id}`)
  const notification = member.collection('notifications').doc(id)
  const pushJob = db.collection('_pushOutbox').doc(`${memberId}:${id}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 140))
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  assert(secret, 'Auth secret is required to simulate a member session in localhost tests')
  const memberToken = await encode({ secret, salt: 'authjs.session-token', token: { sub: memberId, id: memberId, name: 'Test member', email: `${memberId}@example.test`, workspaceIds: [id], isSubscribed: true } })
  const memberCookie = `authjs.session-token=${memberToken}`
  const autoCreatedIds: string[] = []
  const deleteRequest = (confirmationName: string, overrideCookie?: string) => request(`/api/workspaces/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationName }) }, overrideCookie)
  try {
    await workspace.set({ name, ownerId, members: [ownerId, memberId], type: 'shared', createdAt: new Date(), updatedAt: new Date() })
    await member.set({ name: 'Disposable test member', email: `${memberId}@example.test`, workspaceIds: [id] })
    await owner.update({ workspaceIds: FieldValue.arrayUnion(id) })
    await workspace.collection('debits').doc('fixture').set({ description: 'Disposable expense', value: 42 })
    await workspace.collection('goals').doc('fixture').collection('contributions').doc('nested').set({ value: 1 })
    await invitation.set({ workspaceId: id, status: 'test-only' })
    await emailJob.set({ status: 'test-only' })
    await notification.set({ workspaceId: id })
    await pushJob.set({ status: 'test-only' })
    await storage.file(proof).save(Buffer.from('disposable test proof'))
    await storage.file(icon).save(Buffer.from('disposable test bank icon'))
    const anonymous = await deleteRequest(name, '')
    assert([401, 307].includes(anonymous.status), 'Anonymous requests must be rejected or redirected to login by middleware')
    assert.equal((await deleteRequest(name, memberCookie)).status, 403)
    assert.equal((await deleteRequest('incorrect name')).status, 400)
    assert((await workspace.get()).exists)

    // Regression: a normal member write must succeed and release its lease.
    const createCategory = await request(`/api/workspaces/${id}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Disposable category', icon: 'tag', type: 'all' }) }, memberCookie)
    assert.equal(createCategory.status, 201, 'Normal category creation must continue working')
    assert.equal((await workspace.get()).data()?.activeMutations, 0)
    assert((await workspace.collection('mutationLeases').get()).empty)
    assert.equal((await request(`/${id}/manage`)).status, 200)
    const result = await deleteRequest(name)
    if (result.status !== 200) throw new Error(`Deletion returned ${result.status}: ${(await result.json() as { message?: string }).message}`)
    assert(!(await workspace.get()).exists)
    assert((await workspace.collection('debits').get()).empty)
    assert((await workspace.collection('goals').doc('fixture').collection('contributions').get()).empty)
    for (const target of [invitation, emailJob, notification, pushJob]) assert(!(await target.get()).exists)
    assert.equal((await storage.file(proof).exists())[0], false)
    assert.equal((await storage.file(icon).exists())[0], false)
    assert(!(await owner.get()).data()?.workspaceIds.includes(id))
    assert.deepEqual((await member.get()).data()?.workspaceIds, [])
    assert.equal((await request(`/api/workspaces/${id}/categories`)).status, 403)
    const after = await (await request('/api/workspaces')).json() as Array<{ id: string }>
    assert(!after.some(item => item.id === id))
    for (const original of baseline) assert(after.some(item => item.id === original.id), 'Existing workspaces must remain available')
    assert.equal((await deleteRequest(name)).status, 404)
    // The disposable member now has no workspace. Exercise deleting their last
    // personally owned workspace and the existing empty-workspace fallback.
    const firstFallback = await (await request('/api/workspaces', {}, memberCookie)).json() as Array<{ id: string; name: string; ownerId: string }>
    assert.equal(firstFallback.length, 1)
    assert.equal(firstFallback[0].ownerId, memberId)
    autoCreatedIds.push(firstFallback[0].id)
    const lastDelete = await request(`/api/workspaces/${firstFallback[0].id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationName: firstFallback[0].name }) }, memberCookie)
    assert.equal(lastDelete.status, 200)
    const secondFallback = await (await request('/api/workspaces', {}, memberCookie)).json() as Array<{ id: string; ownerId: string }>
    assert.equal(secondFallback.length, 1)
    assert.equal(secondFallback[0].ownerId, memberId)
    assert.notEqual(secondFallback[0].id, firstFallback[0].id)
    autoCreatedIds.push(secondFallback[0].id)
    assert((await db.collection('workspaces').doc(secondFallback[0].id).collection('debits').get()).empty)
    console.log('Preview integration passed: login, unauthenticated/member denial, exact name, normal member writes, full cleanup, nested data, files, list refresh and existing workspace isolation.')
  } finally {
    // Cleanup is constrained to IDs created by this run.
    assert(id.startsWith('test-delete-'))
    await owner.update({ workspaceIds: FieldValue.arrayRemove(id) })
    await db.recursiveDelete(workspace)
    for (const autoId of autoCreatedIds) {
      const autoRef = db.collection('workspaces').doc(autoId)
      const autoDoc = await autoRef.get()
      if (autoDoc.exists) {
        assert.equal(autoDoc.data()?.ownerId, memberId)
        await db.recursiveDelete(autoRef)
      }
    }
    await db.recursiveDelete(member)
    for (const target of [invitation, emailJob, pushJob]) await target.delete()
    await storage.file(proof).delete({ ignoreNotFound: true })
    await storage.file(icon).delete({ ignoreNotFound: true })
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Preview test failed'); process.exitCode = 1 })
