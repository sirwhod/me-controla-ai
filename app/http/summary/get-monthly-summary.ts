import { api } from '@/app/lib/axios'

export interface MonthlySummary {
  month: string
  year: number
  totalExpenses: number
  totalIncome: number
  balance: number
  debitCount: number
  creditCount: number
  status: 'ready'
}

export async function getMonthlySummary(workspaceId: string, month: string, year: number) {
  const response = await api.get<MonthlySummary>(`/workspaces/${workspaceId}/summary`, { params: { month, year } })
  return response.data
}
