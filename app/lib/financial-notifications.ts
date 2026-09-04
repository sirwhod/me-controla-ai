import 'server-only'
import { db } from '@/app/lib/firebase'
import { createNotification } from '@/app/lib/notifications'

export async function notifyWorkspaceFinancialEvent(input: { workspaceId: string; actorUserId: string; kind: 'created' | 'updated' | 'deleted'; entryType: 'despesa' | 'receita'; description?: string; entryId?: string }) {
  const workspace = await db.collection('workspaces').doc(input.workspaceId).get()
  const memberIds = Array.from(new Set([workspace.data()?.ownerId, ...(workspace.data()?.members || [])])).filter((id): id is string => Boolean(id) && id !== input.actorUserId)
  const action = input.kind === 'created' ? 'adicionou' : input.kind === 'updated' ? 'alterou' : 'excluiu'
  await Promise.all(memberIds.map(userId => createNotification({ userId, type: 'workspace.financial_entry_changed', category: 'financial', title: `${input.entryType[0].toUpperCase()}${input.entryType.slice(1)} ${input.kind === 'created' ? 'adicionada' : input.kind === 'updated' ? 'alterada' : 'excluída'}`, body: `${input.actorUserId === userId ? 'Você' : 'Um membro'} ${action} uma ${input.entryType}${input.description ? `: ${input.description}` : ''}.`, workspaceId: input.workspaceId, actionUrl: `/${input.workspaceId}/dashboard`, dedupeKey: `financial:${input.workspaceId}:${input.entryType}:${input.kind}:${input.entryId || Date.now()}:${userId}` })))
}
