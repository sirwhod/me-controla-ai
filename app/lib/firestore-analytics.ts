import { FieldValue } from 'firebase-admin/firestore'
import { db } from './firebase'

export type AnalyticsDelta = {
  workspaceId: string
  year: number
  month: string
  expenses?: number
  income?: number
  debitCount?: number
  creditCount?: number
}

/** Atualiza uma projeção mensal de forma atômica; os lançamentos continuam sendo a fonte de verdade. */
export async function applyMonthlyAnalyticsDelta(delta: AnalyticsDelta) {
  const id = `${delta.year}-${delta.month}`
  const ref = db.collection('workspaces').doc(delta.workspaceId).collection('analytics').doc(id)
  await ref.set({ workspaceId: delta.workspaceId, year: delta.year, month: delta.month, updatedAt: FieldValue.serverTimestamp(), ...(delta.expenses !== undefined ? { totalExpenses: FieldValue.increment(delta.expenses) } : {}), ...(delta.income !== undefined ? { totalIncome: FieldValue.increment(delta.income) } : {}), ...(delta.debitCount !== undefined ? { debitCount: FieldValue.increment(delta.debitCount) } : {}), ...(delta.creditCount !== undefined ? { creditCount: FieldValue.increment(delta.creditCount) } : {}) }, { merge: true })
}
