import 'server-only'

import { db } from '@/app/lib/firebase'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'
import { FINANCIAL_PERIOD_SCHEMA_VERSION, financialPeriodId, moneyToCents, serializeFinancialPeriod } from '@/app/lib/financial-periods'

export type MonthlyTotal = {
  totalExpenses: number
  totalIncome: number
  debitCount: number
  creditCount: number
  source: 'aggregate' | 'fallback'
}

export async function getMonthlyFinancialSummary(workspaceId: string, year: number, month: string): Promise<MonthlyTotal> {
  const workspace = db.collection('workspaces').doc(workspaceId)
  const aggregate = await workspace.collection('financialPeriods').doc(financialPeriodId(year, month)).get()
  if (aggregate.exists && aggregate.data()?.schemaVersion === FINANCIAL_PERIOD_SCHEMA_VERSION) return { ...serializeFinancialPeriod(aggregate.data()!), source: 'aggregate' }
  const [debits, credits] = await Promise.all([
    workspace.collection('debits').where('month', '==', month).where('year', '==', year).get(),
    workspace.collection('credits').where('month', '==', month).where('year', '==', year).get(),
  ])
  return { totalExpenses: debits.docs.reduce((sum, doc) => sum + moneyToCents(doc.data().value), 0) / 100,
    totalIncome: credits.docs.reduce((sum, doc) => sum + moneyToCents(doc.data().value), 0) / 100,
    debitCount: debits.size, creditCount: credits.size, source: 'fallback' }
}

export async function getYearlyFinancialSummary(workspaceId: string, year: number) {
  return new Map(await Promise.all(FINANCIAL_MONTHS.map(async (month) => [month, await getMonthlyFinancialSummary(workspaceId, year, month)] as const)))
}
