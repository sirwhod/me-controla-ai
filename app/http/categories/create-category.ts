import { api } from '@/app/lib/axios'
import { CreateCategory } from '@/app/types/financial'

interface CreateCategoryResponse {
  message: string;
  categoryId: string; // O ID do categoria criada
}

export async function createCategory(
  workspaceId: string, 
  {
    name,
    type
  }: CreateCategory
): Promise<CreateCategoryResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a criação da categoria.",
      categoryId: ""
    }
  }

  const response = await api.post<CreateCategoryResponse>(
    `/workspaces/${workspaceId}/categories`,
    {
      name,
      type
    }
  )

  return response.data
}