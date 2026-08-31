/** Safe by default: this script never writes unless every apply guard below passes. */
import { createHash, randomUUID } from 'node:crypto'
import { FieldPath, FieldValue } from 'firebase-admin/firestore'
import { db } from '../app/lib/firebase'
import { FINANCIAL_MONTHS } from '../app/lib/financial-period'
import { FINANCIAL_PERIOD_SCHEMA_VERSION, financialPeriodId, moneyToCents, monthNumber } from '../app/lib/financial-periods'

const args = new Map(process.argv.slice(2).map((arg) => { const [key, ...rest] = arg.split('='); return [key, rest.join('=') || 'true'] }))
const apply = args.has('--apply')
const audit = args.has('--audit')
const workspaceId = args.get('--workspaceId')
const year = Number(args.get('--year'))
const requestedMonth = args.get('--month')
const pageSize = Math.min(200, Math.max(1, Number(args.get('--pageSize') ?? 100)))
const maxDocuments = Math.min(10_000, Math.max(1, Number(args.get('--maxDocuments') ?? 1000)))
const projectId = args.get('--projectId')
const confirmation = args.get('--confirm')

if (!workspaceId || !Number.isInteger(year)) throw new Error('--workspaceId e --year são obrigatórios')
if (apply && (!requestedMonth || !projectId || confirmation !== 'APPLY_TO_EMULATOR')) throw new Error('--apply exige --month, --projectId e --confirm=APPLY_TO_EMULATOR')
if (apply && !process.env.FIRESTORE_EMULATOR_HOST) throw new Error('--apply é bloqueado fora do Firebase Emulator')
if (apply && process.env.GCLOUD_PROJECT !== projectId) throw new Error('O --projectId não corresponde ao ambiente confirmado')

type Totals = { expenses: number; income: number; debits: number; credits: number; responsibles: Map<string, Totals> }
const periods = new Map<string, Totals>()
const empty = (): Totals => ({ expenses: 0, income: 0, debits: 0, credits: 0, responsibles: new Map() })
let scanned = 0

for (const collection of ['debits', 'credits'] as const) {
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined
  while (scanned < maxDocuments) {
    let query: FirebaseFirestore.Query = db.collection('workspaces').doc(workspaceId).collection(collection).where('year', '==', year)
    if (requestedMonth) query = query.where('month', '==', requestedMonth.toLowerCase())
    query = query.orderBy(FieldPath.documentId()).limit(Math.min(pageSize, maxDocuments - scanned))
    if (cursor) query = query.startAfter(cursor)
    const page = await query.get()
    if (page.empty) break
    for (const document of page.docs) {
      const data = document.data(); const id = financialPeriodId(data.year, data.month)
      const total = periods.get(id) ?? empty(); const cents = moneyToCents(data.value)
      if (collection === 'debits') { total.expenses += cents; total.debits += 1 } else { total.income += cents; total.credits += 1 }
      if (data.responsibleId) {
        const responsible = total.responsibles.get(data.responsibleId) ?? empty()
        if (collection === 'debits') { responsible.expenses += cents; responsible.debits += 1 } else { responsible.income += cents; responsible.credits += 1 }
        total.responsibles.set(data.responsibleId, responsible)
      }
      periods.set(id, total); scanned += 1
    }
    cursor = page.docs.at(-1); if (page.size < pageSize) break
  }
}

const runId = randomUUID()
const report: unknown[] = []
for (const [id, totals] of periods) {
  const canonical = JSON.stringify({ id, expenses: totals.expenses, income: totals.income, debits: totals.debits, credits: totals.credits })
  const checksum = createHash('sha256').update(canonical).digest('hex')
  const ref = db.collection('workspaces').doc(workspaceId).collection('financialPeriods').doc(id)
  const current = audit ? await ref.get() : null
  const expected = { workspaceId, year, month: monthNumber(requestedMonth ?? FINANCIAL_MONTHS[Number(id.slice(-2)) - 1]),
    totalExpensesCents: totals.expenses, totalIncomeCents: totals.income, debitCount: totals.debits, creditCount: totals.credits,
    sourceDebitCount: totals.debits, sourceCreditCount: totals.credits, schemaVersion: FINANCIAL_PERIOD_SCHEMA_VERSION, generation: runId, checksum }
  report.push({ period: id, status: current && current.exists && current.data()?.checksum === checksum ? 'match' : 'different', checksum })
  if (apply) {
    const batch = db.batch(); batch.set(ref, { ...expected, updatedAt: FieldValue.serverTimestamp(), reconciledAt: FieldValue.serverTimestamp() })
    for (const [responsibleId, value] of totals.responsibles) batch.set(ref.collection('responsibles').doc(responsibleId), {
      totalExpensesCents: value.expenses, totalIncomeCents: value.income, debitCount: value.debits, creditCount: value.credits, updatedAt: FieldValue.serverTimestamp(), generation: runId,
    })
    await batch.commit()
  }
}
console.info(JSON.stringify({ mode: apply ? 'apply-emulator' : audit ? 'audit' : 'dry-run', workspaceHash: createHash('sha256').update(workspaceId).digest('hex').slice(0, 16), scanned, periods: report }, null, 2))
