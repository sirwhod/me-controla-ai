import { api } from '@/app/lib/axios'

interface DeleteBankResponse {
  message: string;
}

export async function deleteBanks(
  workspaceId: string, 
  bankId: string,
): Promise<DeleteBankResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão do banco."
    }
  }

  if (!bankId) {
    return {
      message: "O Id do banco é nescessário para a exclusão do banco."
    }
  }

  const response = await api.delete<DeleteBankResponse>(
    `/workspaces/${workspaceId}/banks/${bankId}`,
  )

  return response.data
}