import { api } from '@/app/lib/axios'

interface DeleteCategoryResponse {
  message: string;
}

export async function deleteCategorys(
  workspaceId: string, 
  categoryId: string,
): Promise<DeleteCategoryResponse> {
  if (!workspaceId) {
    return {
      message: "O Id da Caixinha é nescessário para a exclusão da categoria."
    }
  }

  if (!categoryId) {
    return {
      message: "O Id da categoria é nescessário para a exclusão da categoria."
    }
  }

  const response = await api.delete<DeleteCategoryResponse>(
    `/workspaces/${workspaceId}/categories/${categoryId}`,
  )

  return response.data
}