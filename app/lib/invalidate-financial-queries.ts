import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/app/lib/query-keys'

export function invalidateFinancialQueries(queryClient: QueryClient, workspaceId?: string) {
  if (!workspaceId) return Promise.resolve()

  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary(workspaceId).slice(0, 2) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.annualSummary(workspaceId).slice(0, 2) }),
  ]).then(() => undefined)
}
