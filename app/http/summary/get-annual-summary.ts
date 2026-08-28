import { api } from '@/app/lib/axios'
import type { MonthlySummary } from './get-monthly-summary'

export async function getAnnualSummary(workspaceId: string, year: number) {
  const response = await api.get<Array<MonthlySummary & { ready: boolean }>>(`/workspaces/${workspaceId}/summary/annual`, { params: { year } })
  return response.data
}
