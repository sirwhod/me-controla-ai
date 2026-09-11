import assert from 'node:assert/strict'
import { dateForFinancialPeriod } from '../app/lib/financial-period.ts'

const now = new Date(2026, 8, 11, 18, 30, 0)
const filteredDate = dateForFinancialPeriod('maio', '2025', now)
assert.equal(filteredDate.getFullYear(), 2025)
assert.equal(filteredDate.getMonth(), 4)
assert.equal(filteredDate.getDate(), 1)

const currentDate = dateForFinancialPeriod('setembro', '2026', now)
assert.equal(currentDate.getFullYear(), 2026)
assert.equal(currentDate.getMonth(), 8)
assert.equal(currentDate.getDate(), 11)

console.log('Financial period date regression tests passed.')
