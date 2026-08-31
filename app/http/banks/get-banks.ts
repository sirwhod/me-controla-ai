import { api } from '@/app/lib/axios'
import { Bank } from '@/app/types/financial'

export async function getBanks(workspaceId: string, includeCardsCount = false): Promise<Bank[]> {
  const response = await api.get<Bank[]>(`/workspaces/${workspaceId}/banks`, { params: { includeCardsCount } })

  return response.data
}
