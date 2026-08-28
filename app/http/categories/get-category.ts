import { api } from '@/app/lib/axios'
import { Category } from '@/app/types/financial'

export async function getCategory(workspaceId: string, categoryId: string): Promise<Category> {
  const response = await api.get<Category>(`/workspaces/${workspaceId}/categories/${categoryId}`)
  return response.data
}
