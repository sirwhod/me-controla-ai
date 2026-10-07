import 'server-only'

import { FieldValue } from 'firebase-admin/firestore'
import { hostname } from 'node:os'
import { db, storage } from './firebase'

export class WorkspaceDeletionError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

export async function deleteWorkspace(workspaceId: string, userId: string, confirmationName: unknown) {
  const workspaceRef = db.collection('workspaces').doc(workspaceId)
  const memberIds = await db.runTransaction(async transaction => {
    const workspace = await transaction.get(workspaceRef)
    if (!workspace.exists) throw new WorkspaceDeletionError('Caixinha não encontrada.', 404)
    const data = workspace.data()!
    if (data.ownerId !== userId) throw new WorkspaceDeletionError('Somente o proprietário pode excluir a caixinha.', 403)
    if (typeof confirmationName !== 'string' || confirmationName !== data.name) {
      throw new WorkspaceDeletionError('Digite o nome exato da caixinha para confirmar.', 400)
    }
    const leases = await transaction.get(workspaceRef.collection('mutationLeases'))
    const recoverable = leases.docs.filter(lease => {
      const value = lease.data()
      if (value.status === 'finished') return true
      if (value.hostname !== hostname() || !Number.isInteger(value.pid) || value.pid <= 0) return false
      try { process.kill(value.pid, 0); return false } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'ESRCH'
      }
    })
    if (Number(data.activeMutations || 0) > recoverable.length || leases.size > recoverable.length) {
      throw new WorkspaceDeletionError('Há uma alteração em andamento nesta caixinha. Aguarde e tente novamente.', 409)
    }
    recoverable.forEach(lease => transaction.delete(lease.ref))
    transaction.update(workspaceRef, { deleting: true, activeMutations: 0, updatedAt: new Date() })
    return Array.from(new Set<string>([userId, ...(Array.isArray(data.members) ? data.members : [])]))
  })

  // Keep the parent until cleanup completes: failed requests can safely retry.
  // BulkWriter/recursiveDelete avoids Firestore's 500-write batch limit.
  const users = await db.collection('users').where('workspaceIds', 'array-contains', workspaceId).get()
  const invitations = await db.collection('invitations').where('workspaceId', '==', workspaceId).get()
  // Scan user roots to include former members and invitees without requiring a
  // new collection-group index to be deployed before this feature can work.
  const allUsers = await db.collection('users').get()
  const notificationSnapshots = await Promise.all(Array.from(new Set([...memberIds, ...allUsers.docs.map(user => user.id)])).map(id =>
    db.collection('users').doc(id).collection('notifications').where('workspaceId', '==', workspaceId).get()))
  const writer = db.bulkWriter()
  const writes: Promise<unknown>[] = []
  for (const user of users.docs) {
    writes.push(writer.update(user.ref, { workspaceIds: FieldValue.arrayRemove(workspaceId), updatedAt: new Date() }))
  }
  for (const invitation of invitations.docs) {
    writes.push(writer.delete(db.collection('_emailOutbox').doc(`workspace-invitation:${invitation.id}`)))
  }
  for (const notification of notificationSnapshots.flatMap(snapshot => snapshot.docs)) {
    const userId = notification.ref.parent.parent?.id
    if (userId) writes.push(writer.delete(db.collection('_pushOutbox').doc(`${userId}:${notification.id}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 140))))
  }
  await Promise.all([...writes, writer.close()])
  // Preserve source IDs until their outbox jobs have been removed successfully,
  // so a retry can still discover the jobs after any individual write failure.
  const sourceWriter = db.bulkWriter()
  const sourceWrites = [...invitations.docs, ...notificationSnapshots.flatMap(snapshot => snapshot.docs)]
    .map(doc => sourceWriter.delete(doc.ref))
  await Promise.all([...sourceWrites, sourceWriter.close()])
  await storage.deleteFiles({ prefix: `proofs/${workspaceId}/` })
  await storage.deleteFiles({ prefix: `bank_icons/${workspaceId}/` })
  const collections = await workspaceRef.listCollections()
  for (const collection of collections) await db.recursiveDelete(collection)
  await workspaceRef.delete()
}
