import { api } from '@/app/lib/axios'
import { CreateGoal } from '@/app/types/financial'

interface CreateGoalResponse {
  message: string;
  goalId: string;
}

export interface CreateGoalProps extends CreateGoal {
  workspaceId: string;
}

export async function createGoal({
  workspaceId,
  name,
  description,
  startDate,
  endDate,
  targetAmount,
}: CreateGoalProps): Promise<CreateGoalResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a criação da meta.",
      goalId: "",
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
    }
  )

  return response.data
}