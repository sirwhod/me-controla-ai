import 'server-only'

import { db } from '@/app/lib/firebase'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'

type MonthlyTotal = {
  totalExpenses: number
  totalIncome: number
  debitCount: number
  creditCount: number
}

export async function getYearlyFinancialSummary(workspaceId: string, year: number) {
  const workspace = db.collection('workspaces').doc(workspaceId)
  const [debits, credits] = await Promise.all([
    workspace.collection('debits').where('year', '==', year).get(),
    workspace.collection('credits').where('year', '==', year).get(),
  ])
  const byMonth = new Map<string, MonthlyTotal>(
    FINANCIAL_MONTHS.map((month) => [
      month,
      { totalExpenses: 0, totalIncome: 0, debitCount: 0, creditCount: 0 },
    ]),
  )

  debits.forEach((document) => {
    const data = document.data()
    const month = String(data.month || '').toLowerCase()
    const total = byMonth.get(month)
    if (!total) return
    total.totalExpenses += Number(data.value) || 0
    total.debitCount += 1
  })

  credits.forEach((document) => {
    const data = document.data()
    const month = String(data.month || '').toLowerCase()
    const total = byMonth.get(month)
    if (!total) return
    total.totalIncome += Number(data.value) || 0
    total.creditCount += 1
  })

  return byMonth
}
