import { api } from '@/app/lib/axios'

interface DeleteCreditResponse {
  message: string;
}

export async function deleteCredit(
  workspaceId: string, 
  creditId: string,
): Promise<DeleteCreditResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão do crédito."
    }
  }

  if (!creditId) {
    return {
      message: "O Id do crédito é nescessário para a exclusão do crédito."
    }
  }

  const response = await api.delete<DeleteCreditResponse>(
    `/workspaces/${workspaceId}/credits/${creditId}`,
  )

  return response.data
}