import { api } from '@/app/lib/axios'
import { UpdateCategory } from '@/app/types/financial'

interface UpdateCategoryResponse {
  message: string;
}

export async function updateCategory(
  workspaceId: string, 
  categoryId: string,
  {
    name,
    type
  }: UpdateCategory
): Promise<UpdateCategoryResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a alteração da categoria."
    }
  }

  if (!categoryId) {
    return {
      message: "O Id da categoria é nescessário para a alteração da categoria."
    }
  }

  const response = await api.patch<UpdateCategoryResponse>(
    `/workspaces/${workspaceId}/categories/${categoryId}`,
    {
      name,
      type
    }
  )

  return response.data
}