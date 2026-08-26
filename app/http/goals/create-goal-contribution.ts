import { api } from '@/app/lib/axios'
import { CreateGoalContribution, GoalContribution } from '@/app/types/financial'

export async function createGoalContribution(
  workspaceId: string,
  goalId: string,
  data: CreateGoalContribution
): Promise<{ message: string; contributionId: string }> {
  const response = await api.post<{ message: string; contributionId: string }>(
    `/workspaces/${workspaceId}/goals/${goalId}/contributions`,
    data
  )
  return response.data
}

export async function getGoalContributions(
  workspaceId: string,
  goalId: string
): Promise<GoalContribution[]> {
  const response = await api.get<GoalContribution[]>(
    `/workspaces/${workspaceId}/goals/${goalId}/contributions`
  )
  return response.data
}
