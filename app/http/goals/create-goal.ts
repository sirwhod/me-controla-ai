import { api } from '@/app/lib/axios'
import { CreateGoal } from '@/app/types/financial'

interface CreateGoalResponse {
  message: string;
  goalId: string; // O ID do categoria criada
}

export async function createGoal(
  workspaceId: string, 
  {
    name,
    description,
    startDate,
    endDate,
    targetAmount,
    userId
  }: CreateGoal
): Promise<CreateGoalResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação da meta.",
      goalId: ""
    }
  }

  const response = await api.post<CreateGoalResponse>(
    `/workspaces/${workspaceId}/goals`,
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