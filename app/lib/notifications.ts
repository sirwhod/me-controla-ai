import 'server-only'
import { db } from './firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { serializeFirestoreDate } from './date-utils'

export type NotificationType = 'workspace.invitation_created' | 'workspace.invitation_accepted' | 'workspace.member_removed' | 'account.email_verified'
export async function createNotification(input: { userId: string; type: NotificationType; category: 'account'|'security'|'workspace'|'financial'|'goals'; title: string; body: string; workspaceId?: string; actionUrl?: string; dedupeKey: string }) {
  const id = input.dedupeKey.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120)
  await db.collection('users').doc(input.userId).collection('notifications').doc(id).set({ ...input, actorUserId: null, resourceType: null, resourceId: null, actionUrl: input.actionUrl || null, readAt: null, archivedAt: null, createdAt: new Date() }, { merge: false })
}
export function serializeNotification(doc: FirebaseFirestore.QueryDocumentSnapshot) { const d=doc.data(); return { id:doc.id, ...d, createdAt:serializeFirestoreDate(d.createdAt), readAt:serializeFirestoreDate(d.readAt), archivedAt:serializeFirestoreDate(d.archivedAt) } }
export { FieldValue }
