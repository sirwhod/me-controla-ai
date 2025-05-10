import { api } from '@/app/lib/axios'
import { CreateBank } from '@/app/types/financial'

interface CreateBankResponse {
  message: string;
  bankId: string; // O ID do banco criado
}

export async function createBanks(
  workspaceId: string, 
  {name, code, iconUrl}: CreateBank
): Promise<CreateBankResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do banco.",
      bankId: ""
    }
  }

  const response = await api.post<CreateBankResponse>(
    `/workspaces/${workspaceId}/banks`,
    {
      name,
      code,
      iconUrl
    }
  )

  return response.data
}