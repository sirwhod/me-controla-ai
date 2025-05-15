import { api } from '@/app/lib/axios'

interface CreateBankResponse {
  message: string;
  bankId: string; // O ID do banco criado
}

interface CreateBankFn {
  payload: FormData;
  workspaceId: string;
}

export async function createBank(
  { workspaceId, payload }: CreateBankFn
): Promise<CreateBankResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação do banco.",
      bankId: ""
    }
  }

  const response = await api.post<CreateBankResponse>(
    `/workspaces/${workspaceId}/banks`,
    payload,
    {
      headers: {
        'Content-Type': undefined
      }
    }
  )

  return response.data
}