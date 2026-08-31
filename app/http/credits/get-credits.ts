import { api } from '@/app/lib/axios'
import { Credit } from '@/app/types/financial'
import type { FinancialPage, FinancialPeriodParams } from '@/app/http/debits/get-debits'

export async function getCreditsPage(workspaceId: string, params?: FinancialPeriodParams): Promise<FinancialPage<Credit>> {
  const response = await api.get<Credit[]>(`/workspaces/${workspaceId}/credits`, { params })
  return { items: response.data, nextCursor: response.headers['x-next-cursor'] || null }
}

export async function getCredits(
  workspaceId: string,
  params?: FinancialPeriodParams
): Promise<Credit[]> {
  return (await getCreditsPage(workspaceId, params)).items
}
