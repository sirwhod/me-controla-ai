import assert from 'node:assert/strict'
import axios from 'axios'
import {
  FINANCIAL_LIST_FALLBACK_LIMIT,
  FinancialIndexNotReadyError,
  getFinancialListPage,
  isFirestoreIndexNotReady,
} from '../app/lib/financial-list-query.ts'
import { queryRetryDelay, shouldRetryQuery } from '../app/lib/query-retry.ts'

type MockDoc = { id: string; data: () => Record<string, unknown> }

function mockCollection(docs: MockDoc[]) {
  const indexedQuery = {
    where() { return this },
    orderBy() { return this },
    startAfter() { return this },
    limit() { return this },
    async get() { throw Object.assign(new Error('The query requires an index that is currently building'), { code: 9 }) },
  }
  return {
    where: indexedQuery.where.bind(indexedQuery),
    orderBy: indexedQuery.orderBy.bind(indexedQuery),
    startAfter: indexedQuery.startAfter.bind(indexedQuery),
    async get() { return { size: docs.length, docs } },
    limit() { return { get: async () => ({ size: docs.length, docs }) } },
  } as unknown as FirebaseFirestore.CollectionReference
}

const doc = (id: string, date: string, month = 'agosto', year = 2026): MockDoc => ({
  id,
  data: () => ({ date: new Date(date), month, year }),
})

assert.equal(isFirestoreIndexNotReady({ code: 9 }), true)
assert.equal(isFirestoreIndexNotReady(new Error('permission denied')), false)

const collection = mockCollection([
  doc('a', '2026-08-01T00:00:00.000Z'),
  doc('c', '2026-08-03T00:00:00.000Z'),
  doc('b', '2026-08-02T00:00:00.000Z'),
  doc('ignored', '2026-07-31T00:00:00.000Z', 'julho'),
])
const first = await getFinancialListPage({ collection, month: 'agosto', year: '2026', pageLimit: 2, cursor: null })
assert.equal(first.fallback, true)
assert.deepEqual(first.docs.map((item) => item.id), ['c', 'b'])
assert.ok(first.nextCursor)
const second = await getFinancialListPage({ collection, month: 'agosto', year: '2026', pageLimit: 2, cursor: first.nextCursor })
assert.deepEqual(second.docs.map((item) => item.id), ['a'])
assert.equal(second.nextCursor, null)

const oversized = Array.from({ length: FINANCIAL_LIST_FALLBACK_LIMIT + 1 }, (_, index) => doc(String(index), '2026-08-01T00:00:00.000Z'))
await assert.rejects(
  getFinancialListPage({ collection: mockCollection(oversized), month: 'agosto', year: '2026', pageLimit: 50, cursor: null }),
  FinancialIndexNotReadyError,
)

const retryableError = new axios.AxiosError('index', '503', undefined, undefined, {
  status: 503,
  statusText: 'Service Unavailable',
  headers: {},
  config: { headers: {} } as never,
  data: { code: 'FIRESTORE_INDEX_NOT_READY', retryable: true },
})
assert.equal(shouldRetryQuery(3, retryableError), true)
assert.equal(shouldRetryQuery(4, retryableError), false)
assert.equal(queryRetryDelay(5, retryableError), 15_000)

console.log('Index rollout regression tests passed.')
