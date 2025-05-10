import { api } from '@/app/lib/axios'
import { Debit } from '@/app/types/financial'

export async function getDebits(workspaceId: string): Promise<Debit[]> {
  const response = await api.get<Debit[]>(`/workspaces/${workspaceId}/debits`)

  return response.data
}