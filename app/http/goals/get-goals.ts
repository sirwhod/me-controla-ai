import { api } from '@/app/lib/axios'
import { Goal } from '@/app/types/financial'

export async function getGoals(workspaceId: string): Promise<Goal[]> {
  const response = await api.get<Goal[]>(`/workspaces/${workspaceId}/goals`)

  return response.data
}