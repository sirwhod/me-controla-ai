import { api } from '@/app/lib/axios'
import { UpdateCategory } from '@/app/types/financial'

interface UpdateCategoryResponse {
  message: string;
}

export async function updateCategory(
  workspaceId: string, 
  categoryId: string,
  payload: UpdateCategory
): Promise<UpdateCategoryResponse> {
  if (!workspaceId) {
    throw new Error("O Id da Caixinha é necessário para a alteração da categoria.")
  }

  if (!categoryId) {
    throw new Error("O Id da categoria é necessário para a alteração da categoria.")
  }

  const response = await api.patch<UpdateCategoryResponse>(
    `/workspaces/${workspaceId}/categories/${categoryId}`,
    payload
  )

  return response.data
}