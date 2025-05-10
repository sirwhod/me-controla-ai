import { api } from '@/app/lib/axios'

interface DeleteGoalResponse {
  message: string;
}

export async function deleteGoal(
  workspaceId: string, 
  goalId: string,
): Promise<DeleteGoalResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão da meta."
    }
  }

  if (!goalId) {
    return {
      message: "O Id da meta é nescessário para a exclusão da meta."
    }
  }

  const response = await api.delete<DeleteGoalResponse>(
    `/workspaces/${workspaceId}/goals/${goalId}`,
  )

  return response.data
}