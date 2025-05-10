import { api } from '@/app/lib/axios'

export interface Workspace {
  id: string
  name: string
  ownerId: string
  members: string[]
  type: 'personal' | 'shared'
  createdAt: string 
  updatedAt: string 
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const response = await api.get<Workspace[]>('/workspaces')
  return response.data
}