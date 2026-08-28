import { api } from '@/app/lib/axios'
import { Credit } from '@/app/types/financial'
import type { FinancialPeriodParams } from '@/app/http/debits/get-debits'

export async function getCredits(
  workspaceId: string,
  params?: FinancialPeriodParams
): Promise<Credit[]> {
  const response = await api.get<Credit[]>(`/workspaces/${workspaceId}/credits`, { params })

  return response.data
}
