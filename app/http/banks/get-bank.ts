import { api } from '@/app/lib/axios'
import { Bank } from '@/app/types/financial'

export async function getBank(workspaceId: string, bankId: string): Promise<Bank> {
  const response = await api.get<Bank>(`/workspaces/${workspaceId}/banks/${bankId}`)
  return response.data
}
