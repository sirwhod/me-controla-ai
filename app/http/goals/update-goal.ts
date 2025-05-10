import { api } from '@/app/lib/axios'
import { UpdateGoal } from '@/app/types/financial'

interface UpdateGoalResponse {
  message: string;
}

export async function updateGoal(
  workspaceId: string, 
  goalId: string,
  {
    name,
    description,
    startDate,
    endDate,
    targetAmount,
    userId
  }: UpdateGoal
): Promise<UpdateGoalResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a alteração da meta."
    }
  }

  if (!goalId) {
    return {
      message: "O Id da meta é nescessário para a alteração da meta."
    }
  }

  const response = await api.patch<UpdateGoalResponse>(
    `/workspaces/${workspaceId}/goals/${goalId}`,
    {
      name,
      description,
      startDate,
      endDate,
      targetAmount,
      userId
    }
  )

  return response.data
}