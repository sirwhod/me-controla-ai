import { api } from '@/app/lib/axios'
import { Debit } from '@/app/types/financial'

export interface FinancialPeriodParams {
  month?: string
  year?: string | number
}

export async function getDebits(
  workspaceId: string,
  params?: FinancialPeriodParams
): Promise<Debit[]> {
  const response = await api.get<Debit[]>(`/workspaces/${workspaceId}/debits`, { params })

  return response.data
}
