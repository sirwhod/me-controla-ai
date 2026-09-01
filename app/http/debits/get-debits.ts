import { api } from '@/app/lib/axios'
import { Debit } from '@/app/types/financial'
import { collectFinancialPages } from '@/app/http/collect-financial-pages'

export interface FinancialPeriodParams {
  month?: string
  year?: string | number
  limit?: number
  cursor?: string
}

export interface FinancialPage<T> { items: T[]; nextCursor: string | null }

export async function getDebitsPage(workspaceId: string, params?: FinancialPeriodParams): Promise<FinancialPage<Debit>> {
  const response = await api.get<Debit[]>(`/workspaces/${workspaceId}/debits`, { params })
  return { items: response.data, nextCursor: response.headers['x-next-cursor'] || null }
}

export async function getDebits(
  workspaceId: string,
  params?: FinancialPeriodParams
): Promise<Debit[]> {
  return collectFinancialPages((cursor) => getDebitsPage(workspaceId, { ...params, limit: 100, cursor }))
}
