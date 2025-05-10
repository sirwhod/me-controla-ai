import { api } from '@/app/lib/axios'
import { Bank } from '@/app/types/financial'

export async function getBanks(workspaceId: string): Promise<Bank[]> {
  const response = await api.get<Bank[]>(`/workspaces/${workspaceId}/banks`)

  return response.data
}