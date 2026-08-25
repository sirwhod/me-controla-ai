import { api } from '@/app/lib/axios'

interface DeleteCreditResponse {
  message: string;
}

export interface DeleteCreditProps {
  workspaceId: string;
  creditId: string;
}

export async function deleteCredit({
  workspaceId,
  creditId,
}: DeleteCreditProps): Promise<DeleteCreditResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é necessário para a exclusão do crédito.",
    }
  }

  if (!creditId) {
    return {
      message: "O Id do crédito é necessário para a exclusão do crédito.",
    }
  }

  const response = await api.delete<DeleteCreditResponse>(
    `/workspaces/${workspaceId}/credits/${creditId}`
  )

  return response.data
}