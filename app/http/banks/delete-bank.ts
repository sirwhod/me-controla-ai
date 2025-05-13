import { api } from '@/app/lib/axios'

interface DeleteBankResponse {
  message: string;
}

export interface DeleteBankProps {
  workspaceId: string, 
  bankId: string,
}

export async function deleteBank(
  { workspaceId, bankId } : DeleteBankProps
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