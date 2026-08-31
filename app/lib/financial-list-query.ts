import { FieldPath } from 'firebase-admin/firestore'

export const FINANCIAL_LIST_FALLBACK_LIMIT = 500

export class FinancialIndexNotReadyError extends Error {
  readonly code = 'FIRESTORE_INDEX_NOT_READY'
  readonly retryable = true

  constructor(message = 'A consulta financeira está sendo preparada. Tente novamente em alguns instantes.') {
    super(message)
    this.name = 'FinancialIndexNotReadyError'
  }
}

export function isFirestoreIndexNotReady(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown }
  const code = String(candidate.code ?? '')
  const text = `${String(candidate.message ?? '')} ${String(candidate.details ?? '')}`.toLowerCase()
  return code === '9' || code === 'failed-precondition' ||
    (text.includes('failed_precondition') && text.includes('index')) ||
    (text.includes('requires an index') && (text.includes('building') || text.includes('cannot be used yet')))
}

interface CursorPayload { date: string; id: string }

function decodeCursor(cursor: string | null): CursorPayload | null {
  if (!cursor) return null
  const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorPayload
  const timestamp = new Date(decoded.date).getTime()
  if (!decoded.id || !Number.isFinite(timestamp)) throw new Error('INVALID_CURSOR')
  return decoded
}

function dateMillis(value: unknown): number {
  const converted = value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
    ? value.toDate()
    : new Date(value as string | number | Date)
  const timestamp = converted.getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function encodeCursor(doc: FirebaseFirestore.QueryDocumentSnapshot): string {
  return Buffer.from(JSON.stringify({
    date: new Date(dateMillis(doc.data().date)).toISOString(),
    id: doc.id,
  })).toString('base64url')
}

export interface FinancialListPage {
  docs: FirebaseFirestore.QueryDocumentSnapshot[]
  nextCursor: string | null
  fallback: boolean
  documentsRead: number
}

interface FinancialListOptions {
  collection: FirebaseFirestore.CollectionReference
  month: string | null
  year: string | null
  pageLimit: number
  cursor: string | null
}

export async function getFinancialListPage({
  collection,
  month,
  year,
  pageLimit,
  cursor,
}: FinancialListOptions): Promise<FinancialListPage> {
  const decodedCursor = decodeCursor(cursor)
  let query: FirebaseFirestore.Query = collection
  if (month && month !== 'todos') query = query.where('month', '==', month.toLowerCase())
  if (year && year !== 'todos') query = query.where('year', '==', Number(year))
  query = query.orderBy('date', 'desc').orderBy(FieldPath.documentId(), 'desc')
  if (decodedCursor) query = query.startAfter(new Date(decodedCursor.date), decodedCursor.id)
  query = query.limit(pageLimit)

  try {
    const snapshot = await query.get()
    const lastDoc = snapshot.docs.at(-1)
    return {
      docs: snapshot.docs,
      nextCursor: lastDoc && snapshot.size === pageLimit ? encodeCursor(lastDoc) : null,
      fallback: false,
      documentsRead: snapshot.size,
    }
  } catch (error) {
    if (!isFirestoreIndexNotReady(error)) throw error
  }

  const fallbackSnapshot = await collection.limit(FINANCIAL_LIST_FALLBACK_LIMIT + 1).get()
  if (fallbackSnapshot.size > FINANCIAL_LIST_FALLBACK_LIMIT) throw new FinancialIndexNotReadyError()

  const requestedMonth = month && month !== 'todos' ? month.toLowerCase() : null
  const requestedYear = year && year !== 'todos' ? Number(year) : null
  let docs = fallbackSnapshot.docs.filter((doc) => {
    const data = doc.data()
    return (!requestedMonth || String(data.month).toLowerCase() === requestedMonth) &&
      (requestedYear === null || Number(data.year) === requestedYear)
  }).sort((left, right) => {
    const dateDifference = dateMillis(right.data().date) - dateMillis(left.data().date)
    return dateDifference || right.id.localeCompare(left.id)
  })

  if (decodedCursor) {
    const cursorMillis = new Date(decodedCursor.date).getTime()
    docs = docs.filter((doc) => {
      const timestamp = dateMillis(doc.data().date)
      return timestamp < cursorMillis || (timestamp === cursorMillis && doc.id < decodedCursor.id)
    })
  }

  const pageDocs = docs.slice(0, pageLimit)
  const lastDoc = pageDocs.at(-1)
  return {
    docs: pageDocs,
    nextCursor: lastDoc && docs.length > pageLimit ? encodeCursor(lastDoc) : null,
    fallback: true,
    documentsRead: fallbackSnapshot.size,
  }
}
