import { api } from "@/app/lib/axios"

export interface WorkspaceMemberInfo {
  id: string
  name: string
  email: string
  image: string | null
  role: 'owner' | 'member'
  joinedAt: string | null
}

export interface WorkspacePendingInvite {
  id: string
  inviteeEmail: string
  status: string
  createdAt: string | null
}

export interface WorkspaceMembersResponse {
  workspace: {
    id: string
    name: string
    type: string
    ownerId: string
  }
  members: WorkspaceMemberInfo[]
  pendingInvites: WorkspacePendingInvite[]
  isOwner: boolean
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMembersResponse> {
  const res = await api.get<WorkspaceMembersResponse>(`/workspaces/${workspaceId}/members`)
  return res.data
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string
): Promise<{ message: string; invitationId: string }> {
  const res = await api.post<{ message: string; invitationId: string }>(
    `/workspaces/${workspaceId}/invitations`,
    { email }
  )
  return res.data
}

export async function removeWorkspaceMember(
  workspaceId: string,
  memberId: string
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/workspaces/${workspaceId}/members`, {
    data: { memberId },
  })
  return res.data
}

export async function cancelWorkspaceInvitation(invitationId: string): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/invitations/${invitationId}`)
  return res.data
}
