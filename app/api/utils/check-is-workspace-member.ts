import { db } from "@/app/lib/firebase"

interface CheckIsWorkspaceMemberProps {
  workspaceId: string
  workspaceIds?: string[]
  userId?: string
}

export async function checkIsWorkspaceMember({
  workspaceId,
  workspaceIds,
  userId,
}: CheckIsWorkspaceMemberProps): Promise<boolean> {
  if (!workspaceId) return false

  // Verificação rápida baseada na lista de workspaces da sessão
  if (Array.isArray(workspaceIds) && workspaceIds.includes(workspaceId)) {
    return true
  }

  // Verificação de segurança adicional consultando o documento do workspace no Firestore
  if (userId) {
    try {
      const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get()
      if (workspaceDoc.exists) {
        const data = workspaceDoc.data()
        const members: string[] = data?.members || []
        return members.includes(userId) || data?.ownerId === userId
      }
    } catch {
      return false
    }
  }

  return false
}