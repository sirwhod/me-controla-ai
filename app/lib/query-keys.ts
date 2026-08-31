export const queryKeys = {
  workspace: (workspaceId: string) => ['workspace', workspaceId] as const,
  debits: (workspaceId: string, month?: string, year?: number) => ['debits', workspaceId, { month, year }] as const,
  credits: (workspaceId: string, month?: string, year?: number) => ['credits', workspaceId, { month, year }] as const,
  monthlySummary: (workspaceId: string, month?: string, year?: number) => ['analytics-summary', workspaceId, { month, year }] as const,
  annualSummary: (workspaceId: string, year?: number) => ['annual-summary', workspaceId, { year }] as const,
  responsibles: (workspaceId: string, month?: string, year?: number) => ['responsibles', workspaceId, { month, year }] as const,
  bank: (workspaceId: string, bankId: string) => ['bank', workspaceId, bankId] as const,
  card: (workspaceId: string, cardId: string) => ['card', workspaceId, cardId] as const,
}
