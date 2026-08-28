import { api } from '@/app/lib/axios'
import { Goal } from '@/app/types/financial'

export async function getGoal(workspaceId: string, goalId: string): Promise<Goal> {
  const response = await api.get<Goal>(`/workspaces/${workspaceId}/goals/${goalId}`)
  return response.data
}
