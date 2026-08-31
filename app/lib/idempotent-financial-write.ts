import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import type { Transaction } from 'firebase-admin/firestore'
import { db } from '@/app/lib/firebase'

const KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/

export function getIdempotencyKey(request: Request): string {
  const supplied = request.headers.get('idempotency-key')?.trim()
  return supplied && KEY_PATTERN.test(supplied) ? supplied : `legacy-${randomUUID()}`
}

export async function runIdempotentFinancialWrite<T extends Record<string, unknown>>(
  workspaceId: string,
  operation: 'create-debit' | 'create-credit',
  key: string,
  write: (transaction: Transaction) => T,
): Promise<{ result: T; replayed: boolean }> {
  const operationId = createHash('sha256').update(`${operation}:${key}`).digest('hex')
  const ref = db.collection('workspaces').doc(workspaceId).collection('financialOperations').doc(operationId)
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref)
    if (existing.exists) return { result: existing.data()?.result as T, replayed: true }
    const result = write(transaction)
    transaction.create(ref, { operation, result, createdAt: new Date() })
    return { result, replayed: false }
  })
}
