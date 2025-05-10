import { api } from '@/app/lib/axios'

interface DeleteDebitResponse {
  message: string;
}

export async function deleteDebit(
  workspaceId: string, 
  debitId: string,
): Promise<DeleteDebitResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão do débito."
    }
  }

  if (!debitId) {
    return {
      message: "O Id do débito é nescessário para a exclusão do débito."
    }
  }

  const response = await api.delete<DeleteDebitResponse>(
    `/workspaces/${workspaceId}/debits/${debitId}`,
  )

  return response.data
}