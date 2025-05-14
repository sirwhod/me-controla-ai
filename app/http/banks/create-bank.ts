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
        'Content-Type': undefined // Ou null. Isso pode fazer o Axios remover o header global e detectar FormData.
                                 // Alguns preferem 'Content-Type': 'multipart/form-data' aqui,
                                 // mas deixar o Axios lidar com o boundary é geralmente melhor.
                                 // Se isso não funcionar, tente omitir completamente a chave 'Content-Type' aqui.
      }
    }
  )

  return response.data
}