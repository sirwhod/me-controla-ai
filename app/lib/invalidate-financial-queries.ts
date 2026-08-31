import type { QueryClient } from '@tanstack/react-query'

export function invalidateFinancialQueries(queryClient: QueryClient, workspaceId?: string) {
  if (!workspaceId) return Promise.resolve()

  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['analytics-summary', workspaceId] }),
    queryClient.invalidateQueries({ queryKey: ['annual-summary', workspaceId] }),
  ]).then(() => undefined)
}
