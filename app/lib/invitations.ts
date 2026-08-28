import 'server-only'

import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebase'

export type InvitationAction = 'accept' | 'reject'

export async function processInvitationAction(input: {
  invitationId: string
  action: InvitationAction
  userId: string
  userEmail: string
}) {
  const inviteRef = db.collection('invitations').doc(input.invitationId)
  const normalizedEmail = input.userEmail.toLowerCase().trim()

  return db.runTransaction(async (transaction) => {
    const inviteDoc = await transaction.get(inviteRef)
    if (!inviteDoc.exists) throw new InvitationError('Convite não encontrado', 404)

    const inviteData = inviteDoc.data()!
    if (String(inviteData.inviteeEmail || '').toLowerCase().trim() !== normalizedEmail) {
      throw new InvitationError('Este convite não pertence a este usuário', 403)
    }
    if (inviteData.status !== 'pending') {
      throw new InvitationError('Este convite não está mais pendente', 409)
    }

    const expiresAt = inviteData.expiresAt?.toDate?.() ??
      (inviteData.expiresAt ? new Date(inviteData.expiresAt) : null)
    if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new InvitationError('Este convite expirou', 410)
    }

    if (input.action === 'reject') {
      transaction.update(inviteRef, { status: 'rejected', rejectedAt: new Date(), updatedAt: new Date() })
      return { workspaceId: null, workspaceName: null }
    }

    const workspaceRef = db.collection('workspaces').doc(inviteData.workspaceId)
    const userRef = db.collection('users').doc(input.userId)
    const [workspaceDoc, userDoc] = await Promise.all([
      transaction.get(workspaceRef),
      transaction.get(userRef),
    ])
    if (!workspaceDoc.exists || !userDoc.exists) {
      throw new InvitationError('Workspace ou usuário não encontrado', 404)
    }

    transaction.update(inviteRef, {
      status: 'accepted', acceptedAt: new Date(), acceptedByUserId: input.userId, updatedAt: new Date(),
    })
    transaction.update(workspaceRef, {
      members: FieldValue.arrayUnion(input.userId), type: 'shared', updatedAt: new Date(),
    })
    transaction.update(userRef, {
      workspaceIds: FieldValue.arrayUnion(inviteData.workspaceId), updatedAt: new Date(),
    })
    return { workspaceId: String(inviteData.workspaceId), workspaceName: String(inviteData.workspaceName || 'Caixinha') }
  })
}

export class InvitationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}
