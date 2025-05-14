import { api } from '@/app/lib/axios'
import { CreateCredit } from '@/app/types/financial'

interface CreateCreditResponse {
  message: string;
  creditId: string; // O ID do categoria criada
}

export async function createCredit(
  workspaceId: string, 
  {
    description,
    value,
    date,
    bankId,
    categoryId,
    paymentMethod,
    proofUrl,
    status
  }: CreateCredit
): Promise<CreateCreditResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do crédito.",
      creditId: ""
    }
  }

  const response = await api.post<CreateCreditResponse>(
    `/workspaces/${workspaceId}/credits`,
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