import { api } from '@/app/lib/axios'

interface DeleteGoalResponse {
  message: string;
}

export interface DeleteGoalProps {
  workspaceId: string;
  goalId: string;
}

export async function deleteGoal({
  workspaceId,
  goalId,
}: DeleteGoalProps): Promise<DeleteGoalResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a exclusão da meta.",
    }
  }

  if (!goalId) {
    return {
      message: "O Id da meta é necessário para a exclusão da meta.",
    }
  }

  const response = await api.delete<DeleteGoalResponse>(
    `/workspaces/${workspaceId}/goals/${goalId}`
  )

  return response.data
}