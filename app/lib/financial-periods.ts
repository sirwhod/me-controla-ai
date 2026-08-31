import 'server-only'

import { FieldValue, Transaction, WriteBatch } from 'firebase-admin/firestore'
import { db } from '@/app/lib/firebase'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'

export const FINANCIAL_PERIOD_SCHEMA_VERSION = 1
export type EntryKind = 'debit' | 'credit'
export type FinancialEntryState = { value?: unknown; month?: unknown; year?: unknown; responsibleId?: unknown }
export type PeriodDelta = { expensesCents: number; incomeCents: number; debitCount: number; creditCount: number }

export function moneyToCents(value: unknown): number {
  const amount = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value)
  if (!Number.isFinite(amount)) throw new TypeError('Valor monetário inválido')
  const cents = Math.round((amount + Number.EPSILON) * 100)
  if (!Number.isSafeInteger(cents)) throw new RangeError('Valor monetário fora do intervalo seguro')
  return cents
}

export function monthNumber(month: unknown): number {
  if (typeof month === 'number' && Number.isInteger(month) && month >= 1 && month <= 12) return month
  const index = FINANCIAL_MONTHS.indexOf(String(month ?? '').toLowerCase() as never)
  if (index < 0) throw new TypeError('Mês inválido')
  return index + 1
}

export function financialPeriodId(year: unknown, month: unknown): string {
  const parsedYear = Number(year)
  const parsedMonth = monthNumber(month)
  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2200) throw new TypeError('Ano inválido')
  return `${parsedYear}-${String(parsedMonth).padStart(2, '0')}`
}

function signedDelta(kind: EntryKind, state: FinancialEntryState, multiplier: 1 | -1) {
  const cents = moneyToCents(state.value) * multiplier
  return {
    id: financialPeriodId(state.year, state.month), year: Number(state.year), month: monthNumber(state.month),
    responsibleId: typeof state.responsibleId === 'string' && state.responsibleId ? state.responsibleId : null,
    delta: kind === 'debit'
      ? { expensesCents: cents, incomeCents: 0, debitCount: multiplier, creditCount: 0 }
      : { expensesCents: 0, incomeCents: cents, debitCount: 0, creditCount: multiplier },
  }
}

export function calculateEntryDeltas(kind: EntryKind, before?: FinancialEntryState | null, after?: FinancialEntryState | null) {
  return [...(before ? [signedDelta(kind, before, -1)] : []), ...(after ? [signedDelta(kind, after, 1)] : [])]
}

type AtomicWriter = Pick<WriteBatch, 'set'> | Pick<Transaction, 'set'>
export function writeFinancialPeriodDeltas(writer: AtomicWriter, workspaceId: string, deltas: ReturnType<typeof calculateEntryDeltas>) {
  for (const item of deltas) {
    const period = db.collection('workspaces').doc(workspaceId).collection('financialPeriods').doc(item.id)
    writer.set(period, {
      workspaceId, year: item.year, month: item.month, schemaVersion: FINANCIAL_PERIOD_SCHEMA_VERSION,
      totalExpensesCents: FieldValue.increment(item.delta.expensesCents),
      totalIncomeCents: FieldValue.increment(item.delta.incomeCents),
      debitCount: FieldValue.increment(item.delta.debitCount), creditCount: FieldValue.increment(item.delta.creditCount),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true })
    if (item.responsibleId) {
      writer.set(period.collection('responsibles').doc(item.responsibleId), {
        totalExpensesCents: FieldValue.increment(item.delta.expensesCents), totalIncomeCents: FieldValue.increment(item.delta.incomeCents),
        debitCount: FieldValue.increment(item.delta.debitCount), creditCount: FieldValue.increment(item.delta.creditCount),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
    }
  }
}

export function serializeFinancialPeriod(data: FirebaseFirestore.DocumentData) {
  return { totalExpenses: Number(data.totalExpensesCents ?? 0) / 100, totalIncome: Number(data.totalIncomeCents ?? 0) / 100,
    debitCount: Number(data.debitCount ?? 0), creditCount: Number(data.creditCount ?? 0) }
}
