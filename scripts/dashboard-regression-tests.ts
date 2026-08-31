import assert from 'node:assert/strict'
import type { QueryClient } from '@tanstack/react-query'
import { FINANCIAL_MONTHS, isValidFinancialPeriod } from '../app/lib/financial-period.ts'
import { invalidateFinancialQueries } from '../app/lib/invalidate-financial-queries.ts'

async function testFinancialPeriodValidation() {
  assert.equal(FINANCIAL_MONTHS.length, 12)
  assert.equal(isValidFinancialPeriod('agosto', 2026), true)
  assert.equal(isValidFinancialPeriod('MARÇO', 2026), true)
  assert.equal(isValidFinancialPeriod('todos', 2026), false)
  assert.equal(isValidFinancialPeriod('', 2026), false)
  assert.equal(isValidFinancialPeriod('agosto', Number.NaN), false)
  assert.equal(isValidFinancialPeriod('agosto', 1999), false)
  assert.equal(isValidFinancialPeriod('agosto', 2201), false)
}

async function testFinancialQueryInvalidation() {
  const invalidatedKeys: unknown[] = []
  const queryClient = {
    invalidateQueries: ({ queryKey }: { queryKey: unknown[] }) => {
      invalidatedKeys.push(queryKey)
      return Promise.resolve()
    },
  } as unknown as QueryClient

  await invalidateFinancialQueries(queryClient, 'workspace-1')
  assert.deepEqual(invalidatedKeys, [
    ['analytics-summary', 'workspace-1'],
    ['annual-summary', 'workspace-1'],
  ])

  invalidatedKeys.length = 0
  await invalidateFinancialQueries(queryClient)
  assert.deepEqual(invalidatedKeys, [])
}

await testFinancialPeriodValidation()
await testFinancialQueryInvalidation()

console.log('Dashboard regression tests passed.')
