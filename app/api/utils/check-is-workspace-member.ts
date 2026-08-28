import { db } from "@/app/lib/firebase"

interface CheckIsWorkspaceMemberProps {
  workspaceId: string
  /** @deprecated Session workspace IDs are UI hints, never authorization input. */
  workspaceIds?: string[]
  userId?: string
}

export async function checkIsWorkspaceMember({
  workspaceId,
  workspaceIds,
  userId,
}: CheckIsWorkspaceMemberProps): Promise<boolean> {
  void workspaceIds
  if (!workspaceId || !userId) return false

  // Firestore is the source of truth so membership removal revokes old JWTs.
  try {
    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get()
    if (!workspaceDoc.exists) return false

    const data = workspaceDoc.data()
    const members: string[] = Array.isArray(data?.members) ? data.members : []
    return members.includes(userId) || data?.ownerId === userId
  } catch {
    return false
  }
}
