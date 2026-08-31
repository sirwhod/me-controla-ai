import { db } from '@/app/lib/firebase'

interface CheckIsWorkspaceMemberProps {
  workspaceId: string
  /** @deprecated Session workspace IDs are UI hints, never authorization input. */
  workspaceIds?: string[]
  userId?: string
}

const inFlightMembershipReads = new Map<string, Promise<boolean>>()

export async function checkIsWorkspaceMember({ workspaceId, workspaceIds, userId }: CheckIsWorkspaceMemberProps): Promise<boolean> {
  void workspaceIds
  if (!workspaceId || !userId) return false
  const key = `${userId}:${workspaceId}`
  const existing = inFlightMembershipReads.get(key)
  if (existing) return existing
  // Firestore remains authoritative. Only concurrent reads share this promise;
  // no result survives completion, so revocation has no cache TTL window.
  const lookup = (async () => {
    try {
      const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get()
      if (!workspaceDoc.exists) return false
      const data = workspaceDoc.data()
      const members: string[] = Array.isArray(data?.members) ? data.members : []
      return members.includes(userId) || data?.ownerId === userId
    } catch { return false }
  })()
  inFlightMembershipReads.set(key, lookup)
  void lookup.finally(() => inFlightMembershipReads.delete(key))
  return lookup
}
