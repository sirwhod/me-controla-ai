import { api } from '@/app/lib/axios'
import { CreateCredit } from '@/app/types/financial'

interface CreateCreditResponse {
  message: string;
  creditId: string;
}

export interface CreateCreditProps extends CreateCredit {
  workspaceId: string;
}

export async function createCredit({
  workspaceId,
  description,
  value,
  date,
  type,
  startDate,
  endDate,
  frequency,
  bankId,
  categoryId,
  responsibleId,
  paymentMethod,
  proofUrl,
  status,
}: CreateCreditProps): Promise<CreateCreditResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a criação do crédito.",
      creditId: "",
    }
  }

  const response = await api.post<CreateCreditResponse>(
    `/workspaces/${workspaceId}/credits`,
    {
      description,
      value,
      date,
      type,
      startDate,
      endDate,
      frequency,
      bankId,
      categoryId,
      responsibleId,
      paymentMethod,
      proofUrl,
      status,
    }
  )

  return response.data
}