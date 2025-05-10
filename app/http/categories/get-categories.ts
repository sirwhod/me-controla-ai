import { api } from '@/app/lib/axios'
import { Category } from '@/app/types/financial'

export async function getCategories(workspaceId: string): Promise<Category[]> {
  const response = await api.get<Category[]>(`/workspaces/${workspaceId}/categories`)

  return response.data
}