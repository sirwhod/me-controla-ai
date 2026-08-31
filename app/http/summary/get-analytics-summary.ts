import { api } from '@/app/lib/axios'

export interface AnalyticsSummary { totalExpenses: number; totalIncome: number; debitCount: number; creditCount: number; balance: number }

export async function getAnalyticsSummary(workspaceId: string, params: { month: string; year: string | number }) {
  const response = await api.get<AnalyticsSummary>(`/workspaces/${workspaceId}/analytics`, { params })
  return response.data
}
