import { api } from '@/app/lib/axios'
import { UpdateCredit } from '@/app/types/financial'

interface UpdateCreditResponse {
  message: string;
}

export async function updateCredit(
  workspaceId: string, 
  creditId: string,
  {
    description,
    value,
    date,
    bankId,
    categoryId,
    paymentMethod,
    proofUrl,
    status
  }: UpdateCredit
): Promise<UpdateCreditResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a alteração do crédito."
    }
  }

  if (!creditId) {
    return {
      message: "O Id do crédito é nescessário para a alteração do crédito."
    }
  }

  const response = await api.patch<UpdateCreditResponse>(
    `/workspaces/${workspaceId}/credits/${creditId}`,
    {
      description,
      value,
      date,
      bankId,
      categoryId,
      paymentMethod,
      proofUrl,
      status
    }
  )

  return response.data
}