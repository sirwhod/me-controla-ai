import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from './query-keys.ts'

export function invalidateFinancialQueries(queryClient: QueryClient, workspaceId?: string) {
  if (!workspaceId) return Promise.resolve()

  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.debits(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.credits(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardDebits(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardCredits(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.annualSummary(workspaceId).slice(0, 2) }),
  ]).then(() => undefined)
}
