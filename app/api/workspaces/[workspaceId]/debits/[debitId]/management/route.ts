import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { calculateEntryDeltas, writeFinancialPeriodDeltas } from '@/app/lib/financial-periods'
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
    : [sourceDoc]
  if (!docs.some((doc) => doc.id === debitId)) docs = [sourceDoc, ...docs]

  const entries: Array<Record<string, unknown> & { id: string; date: string; status: string }> = docs.map((doc) => {
    const data = (doc.data() || {}) as Record<string, unknown>
    return { ...data, id: doc.id, date: asDate(data.date).toISOString(), status: String(data.status || 'pending') }
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
  const body = await req.json().catch(() => ({}))
  const value = Number(body.value)
  if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ message: 'Informe um valor de parcela válido.' }, { status: 400 })

  const collection = db.collection('workspaces').doc(workspaceId).collection('debits')
  const sourceRef = collection.doc(debitId)
  const sourceDoc = await sourceRef.get()
  if (!sourceDoc.exists) return NextResponse.json({ message: 'Despesa não encontrada' }, { status: 404 })
  const source = sourceDoc.data() || {}
  if (!['Fixo', 'Assinatura', 'Parcelamento'].includes(String(source.type))) return NextResponse.json({ message: 'Tipo não gerenciável.' }, { status: 400 })

  const groupField = source.type === 'Parcelamento' ? 'originalDebitId' : 'recurrenceId'
  const groupValue = source[groupField] || (source.type === 'Parcelamento' ? debitId : null)
  const groupDocs = groupValue ? (await collection.where(groupField, '==', groupValue).get()).docs : [sourceDoc]
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
