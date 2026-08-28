import { api } from '@/app/lib/axios'
import { Credit } from '@/app/types/financial'

export async function getCredit(workspaceId: string, creditId: string): Promise<Credit> {
  const response = await api.get<Credit>(`/workspaces/${workspaceId}/credits/${creditId}`)
  return response.data
}
