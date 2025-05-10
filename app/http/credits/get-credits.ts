import { api } from '@/app/lib/axios'
import { Credit } from '@/app/types/financial'

export async function getCredits(workspaceId: string): Promise<Credit[]> {
  const response = await api.get<Credit[]>(`/workspaces/${workspaceId}/credits`)

  return response.data
}