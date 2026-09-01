import 'server-only'

import { db } from '@/app/lib/firebase'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'
import { CARD_TOTALS_SCHEMA_VERSION, FINANCIAL_PERIOD_SCHEMA_VERSION, financialPeriodId, moneyToCents, serializeFinancialPeriod } from '@/app/lib/financial-periods'

export type MonthlyTotal = {
  totalExpenses: number
  totalIncome: number
  debitCount: number
  creditCount: number
  cardTotals: Record<string, number>
  source: 'aggregate' | 'fallback'
  cardTotalsSource: 'aggregate' | 'fallback'
}

function summarizeCards(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Record<string, number> {
  const totals = new Map<string, number>()
  for (const doc of docs) {
    const data = doc.data()
    if (typeof data.creditCardId !== 'string' || !data.creditCardId) continue
    totals.set(data.creditCardId, (totals.get(data.creditCardId) ?? 0) + moneyToCents(data.value))
  }
  return Object.fromEntries([...totals].map(([cardId, cents]) => [cardId, cents / 100]))
}

export async function getMonthlyFinancialSummary(workspaceId: string, year: number, month: string): Promise<MonthlyTotal> {
  const workspace = db.collection('workspaces').doc(workspaceId)
  if (process.env.FINANCIAL_PERIOD_READS_ENABLED === 'true') {
    const aggregate = await workspace.collection('financialPeriods').doc(financialPeriodId(year, month)).get()
    if (aggregate.exists && aggregate.data()?.schemaVersion === FINANCIAL_PERIOD_SCHEMA_VERSION) {
      const data = aggregate.data()!
      if (data.cardTotalsSchemaVersion === CARD_TOTALS_SCHEMA_VERSION) {
        return { ...serializeFinancialPeriod(data), source: 'aggregate', cardTotalsSource: 'aggregate' }
      }
      const debits = await workspace.collection('debits').where('month', '==', month).where('year', '==', year).get()
      return { ...serializeFinancialPeriod(data), cardTotals: summarizeCards(debits.docs), source: 'aggregate', cardTotalsSource: 'fallback' }
    }
  }
  const [debits, credits] = await Promise.all([
    workspace.collection('debits').where('month', '==', month).where('year', '==', year).get(),
    workspace.collection('credits').where('month', '==', month).where('year', '==', year).get(),
  ])
  return { totalExpenses: debits.docs.reduce((sum, doc) => sum + moneyToCents(doc.data().value), 0) / 100,
    totalIncome: credits.docs.reduce((sum, doc) => sum + moneyToCents(doc.data().value), 0) / 100,
    debitCount: debits.size, creditCount: credits.size, cardTotals: summarizeCards(debits.docs), source: 'fallback', cardTotalsSource: 'fallback' }
}

export async function getYearlyFinancialSummary(workspaceId: string, year: number) {
  return new Map(await Promise.all(FINANCIAL_MONTHS.map(async (month) => [month, await getMonthlyFinancialSummary(workspaceId, year, month)] as const)))
}
