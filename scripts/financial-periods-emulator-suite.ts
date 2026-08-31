import Module from 'node:module'

if (!process.env.FIRESTORE_EMULATOR_HOST || !/^demo-/.test(process.env.GCLOUD_PROJECT || '')) {
  throw new Error('Financial suite requires a demo Firebase Emulator project')
}
const originalRequire = (Module.prototype as unknown as { require: (id: string) => unknown }).require
;(Module.prototype as unknown as { require: (id: string) => unknown }).require = function (id: string) {
  if (id === 'server-only') return {}
  return originalRequire.call(this, id)
}

async function main() {
const { db } = await import('../app/lib/firebase')
const { calculateEntryDeltas, financialPeriodId, moneyToCents, writeFinancialPeriodDeltas } = await import('../app/lib/financial-periods')
const { runIdempotentFinancialWrite } = await import('../app/lib/idempotent-financial-write')
const workspaceId = `financial-suite-${Date.now()}`
const workspace = db.collection('workspaces').doc(workspaceId)
const results: Array<[string, boolean]> = []
const check = (name: string, condition: boolean) => results.push([name, condition])

try {
  check('janeiro usa ID estável', financialPeriodId(2026, 'janeiro') === '2026-01')
  check('dezembro usa ID estável', financialPeriodId(2026, 'dezembro') === '2026-12')
  check('centavos são exatos', moneyToCents(10.01) === 1001 && moneyToCents('0,99') === 99)
  let invalidRejected = false
  try { moneyToCents('invalid') } catch { invalidRejected = true }
  check('valor inválido é rejeitado', invalidRejected)

  const entry = { value: 10.01, month: 'janeiro', year: 2026, responsibleId: 'responsible-a' }
  const create = () => runIdempotentFinancialWrite(workspaceId, 'create-debit', 'same-operation-key', (transaction) => {
    const ref = workspace.collection('debits').doc('stable-debit')
    transaction.set(ref, entry)
    writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('debit', null, entry))
    return { debitId: ref.id }
  })
  const concurrent = await Promise.all([create(), create()])
  check('repetição concorrente tem um replay', concurrent.filter((result) => result.replayed).length === 1)
  const january = await workspace.collection('financialPeriods').doc('2026-01').get()
  check('retry não duplica total', january.data()?.totalExpensesCents === 1001 && january.data()?.debitCount === 1)

  const debitRef = workspace.collection('debits').doc('stable-debit')
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(debitRef); const before = current.data()!
    const after = { ...before, value: 20.02, month: 'fevereiro', responsibleId: 'responsible-b' }
    transaction.set(debitRef, after)
    writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('debit', before, after))
  })
  const [januaryAfter, february, responsibleA, responsibleB] = await Promise.all([
    workspace.collection('financialPeriods').doc('2026-01').get(), workspace.collection('financialPeriods').doc('2026-02').get(),
    workspace.collection('financialPeriods').doc('2026-01').collection('responsibles').doc('responsible-a').get(),
    workspace.collection('financialPeriods').doc('2026-02').collection('responsibles').doc('responsible-b').get(),
  ])
  check('mudança de período compensa origem', januaryAfter.data()?.totalExpensesCents === 0 && januaryAfter.data()?.debitCount === 0)
  check('mudança de período incrementa destino', february.data()?.totalExpensesCents === 2002 && february.data()?.debitCount === 1)
  check('mudança de responsável compensa ambos', responsibleA.data()?.totalExpensesCents === 0 && responsibleB.data()?.totalExpensesCents === 2002)

  const installments = [334, 333, 333]
  await db.runTransaction(async (transaction) => {
    const entries = installments.map((cents, index) => ({ value: cents / 100, month: 'março', year: 2026, responsibleId: index % 2 ? 'b' : 'a' }))
    entries.forEach((value, index) => transaction.set(workspace.collection('debits').doc(`installment-${index}`), value))
    writeFinancialPeriodDeltas(transaction, workspaceId, entries.flatMap((value) => calculateEntryDeltas('debit', null, value)))
  })
  const march = await workspace.collection('financialPeriods').doc('2026-03').get()
  check('parcelamento preserva centavos', march.data()?.totalExpensesCents === 1000 && march.data()?.debitCount === 3)

  let failed = false
  try { await db.runTransaction(async (transaction) => { transaction.set(workspace.collection('debits').doc('must-not-exist'), entry); throw new Error('simulated') }) } catch { failed = true }
  check('falha simulada não deixa escrita parcial', failed && !(await workspace.collection('debits').doc('must-not-exist').get()).exists)
  check('outro workspace permanece isolado', (await db.collection('workspaces').doc(`${workspaceId}-other`).collection('financialPeriods').get()).empty)
} finally {
  await db.recursiveDelete(workspace)
}

for (const [name, passed] of results) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`)
const failed = results.filter(([, passed]) => !passed)
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length }))
if (failed.length) process.exitCode = 1
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
