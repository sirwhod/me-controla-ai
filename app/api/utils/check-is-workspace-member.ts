interface CheckIsWorkspaceMemberProps {
  workspaceId: string
  workspaceIds: string[]
}

export async function checkIsWorkspaceMember({workspaceId, workspaceIds}: CheckIsWorkspaceMemberProps): Promise<boolean> {
  const isWorkspaceMember = workspaceIds.includes(workspaceId)

  return isWorkspaceMember
}