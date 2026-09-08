import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { calculateEntryDeltas, writeFinancialPeriodDeltas } from '@/app/lib/financial-periods'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'
import { NextRequest, NextResponse } from 'next/server'

type Params = { workspaceId: string; debitId: string }

function asDate(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') return value.toDate() as Date
  return new Date(String(value))
}

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { workspaceId, debitId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) {
    return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  }

  const collection = db.collection('workspaces').doc(workspaceId).collection('debits')
  const sourceRef = collection.doc(debitId)
  const sourceDoc = await sourceRef.get()
  if (!sourceDoc.exists) return NextResponse.json({ message: 'Despesa não encontrada' }, { status: 404 })
  const source = sourceDoc.data() || {}
  if (!['Fixo', 'Assinatura', 'Parcelamento'].includes(String(source.type))) {
    return NextResponse.json({ message: 'Esta despesa não possui gestão de ocorrências.' }, { status: 400 })
  }

  const groupField = source.type === 'Parcelamento' ? 'originalDebitId' : 'recurrenceId'
  const groupValue = source[groupField] || (source.type === 'Parcelamento' ? debitId : null)
  let docs = groupValue
    ? (await collection.where(groupField, '==', groupValue).get()).docs
    : source.type === 'Parcelamento'
      ? [sourceDoc]
      : (await collection.where('type', '==', source.type).get()).docs.filter((doc) => {
          const data = doc.data() || {}
          const sameDescription = data.description === source.description
          const sourceStart = source.startDate ? asDate(source.startDate).getTime() : null
          const candidateStart = data.startDate ? asDate(data.startDate).getTime() : null
          return sameDescription && (sourceStart === null || candidateStart === sourceStart)
        })
  if (!docs.some((doc) => doc.id === debitId)) docs = [sourceDoc, ...docs]

  const autoPaidIds = new Set<string>()
  if (source.type === 'Parcelamento') {
    const now = new Date()
    const currentMonth = now.getFullYear() * 12 + now.getMonth()
    const toMarkPaid = docs.filter((doc) => {
      const data = doc.data() || {}
      const month = FINANCIAL_MONTHS.indexOf(String(data.month || '').toLowerCase() as typeof FINANCIAL_MONTHS[number])
      const period = Number(data.year) * 12 + month
      return data.status !== 'paid' && month >= 0 && period < currentMonth
    })
    if (toMarkPaid.length) {
      await db.runTransaction(async (transaction) => {
        const snapshots = []
        for (const doc of toMarkPaid) {
          const current = await transaction.get(doc.ref)
          if (current.exists) snapshots.push(doc.ref)
        }
        for (const ref of snapshots) transaction.update(ref, { status: 'paid', updatedAt: new Date() })
      })
      for (const doc of toMarkPaid) autoPaidIds.add(doc.id)
    }
  }

  const entries: Array<Record<string, unknown> & { id: string; date: string; status: string }> = docs.map((doc) => {
    const data = (doc.data() || {}) as Record<string, unknown>
    return { ...data, id: doc.id, date: asDate(data.date).toISOString(), status: autoPaidIds.has(doc.id) ? 'paid' : String(data.status || 'pending') }
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const total = entries.reduce((sum, entry) => sum + Number(entry.value || 0), 0)
  const paid = entries.filter((entry) => entry.status === 'paid').reduce((sum, entry) => sum + Number(entry.value || 0), 0)
  return NextResponse.json({ sourceId: debitId, type: source.type, description: source.description, entries, totals: { total, paid, remaining: Math.max(0, total - paid) } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { workspaceId, debitId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) {
    return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  }
  const collection = db.collection('workspaces').doc(workspaceId).collection('debits')
  const body = await req.json().catch(() => ({}))
  if (body.status === 'paid') {
    const sourceRef = collection.doc(debitId)
    const sourceDoc = await sourceRef.get()
    if (!sourceDoc.exists) return NextResponse.json({ message: 'Despesa não encontrada' }, { status: 404 })
    const source = sourceDoc.data() || {}
    const now = new Date()
    const currentMonth = now.getFullYear() * 12 + now.getMonth()
    const monthIndex = FINANCIAL_MONTHS.indexOf(String(source.month || '').toLowerCase() as typeof FINANCIAL_MONTHS[number])
    const period = Number(source.year) * 12 + monthIndex
    if (monthIndex < 0 || period > currentMonth) return NextResponse.json({ message: 'Somente despesas atuais ou de meses anteriores podem ser marcadas como pagas.' }, { status: 400 })
    await sourceRef.update({ status: 'paid', updatedAt: new Date() })
    return NextResponse.json({ message: 'Despesa marcada como paga.' })
  }
  const value = Number(body.value)
  if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ message: 'Informe um valor de parcela válido.' }, { status: 400 })

  const sourceRef = collection.doc(debitId)
  const sourceDoc = await sourceRef.get()
  if (!sourceDoc.exists) return NextResponse.json({ message: 'Despesa não encontrada' }, { status: 404 })
  const source = sourceDoc.data() || {}
  if (!['Fixo', 'Assinatura', 'Parcelamento'].includes(String(source.type))) return NextResponse.json({ message: 'Tipo não gerenciável.' }, { status: 400 })

  const groupField = source.type === 'Parcelamento' ? 'originalDebitId' : 'recurrenceId'
  const groupValue = source[groupField] || (source.type === 'Parcelamento' ? debitId : null)
  const groupDocs = groupValue
    ? (await collection.where(groupField, '==', groupValue).get()).docs
    : source.type === 'Parcelamento'
      ? [sourceDoc]
      : (await collection.where('type', '==', source.type).get()).docs.filter((doc) => {
          const data = doc.data() || {}
          const sameDescription = data.description === source.description
          const sourceStart = source.startDate ? asDate(source.startDate).getTime() : null
          const candidateStart = data.startDate ? asDate(data.startDate).getTime() : null
          return sameDescription && (sourceStart === null || candidateStart === sourceStart)
        })
  const currentDate = asDate(sourceDoc.data()?.date).getTime()
  const targetDocs = groupDocs.filter((doc) => {
    const data = doc.data() || {}
    return asDate(data.date).getTime() >= currentDate && data.status !== 'paid'
  })
  if (!targetDocs.some((doc) => doc.id === debitId)) targetDocs.push(sourceDoc)

  await db.runTransaction(async (transaction) => {
    const snapshots = []
    for (const doc of targetDocs) {
      const current = await transaction.get(doc.ref)
      if (current.exists) snapshots.push({ doc: doc.ref, previous: current.data() || {} })
    }
    for (const { doc, previous } of snapshots) {
      transaction.update(doc, { value, updatedAt: new Date() })
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('debit', previous, { ...previous, value }))
    }
  })
  return NextResponse.json({ message: 'Valor atualizado na parcela atual e nas próximas.', updatedCount: targetDocs.length })
}
