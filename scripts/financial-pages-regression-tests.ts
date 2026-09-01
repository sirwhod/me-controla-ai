import assert from 'node:assert/strict'
import { collectFinancialPages } from '../app/http/collect-financial-pages.ts'

const cursors: Array<string | undefined> = []
const records = await collectFinancialPages(async (cursor) => {
  cursors.push(cursor)
  if (!cursor) return { items: Array.from({ length: 100 }, (_, index) => index), nextCursor: 'page-2' }
  if (cursor === 'page-2') return { items: Array.from({ length: 100 }, (_, index) => index + 100), nextCursor: 'page-3' }
  return { items: [200, 201, 202], nextCursor: null }
})

assert.equal(records.length, 203, 'todos os registros de todas as páginas devem ser retornados')
assert.deepEqual(cursors, [undefined, 'page-2', 'page-3'])

await assert.rejects(
  () => collectFinancialPages(async () => ({ items: [], nextCursor: 'repeated' })),
  /Cursor repetido/,
)

console.log('Financial pages regression tests passed.')
