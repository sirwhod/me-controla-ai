import { api } from '@/app/lib/axios'

interface CreateCategoryResponse {
  message: string;
  categoryId: string; // O ID do categoria criada
}

interface CreateCategoryProps {
  payload: FormData;
  workspaceId: string;
}

export async function createCategory(
  {
    workspaceId,
    payload
  }: CreateCategoryProps
): Promise<CreateCategoryResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação da categoria.",
      categoryId: ""
    }
  }

  const response = await api.post<CreateCategoryResponse>(
    `/workspaces/${workspaceId}/categories`,
    payload,
    {
      headers: {
        'Content-Type': undefined
      }
    }
  )

  return response.data
}