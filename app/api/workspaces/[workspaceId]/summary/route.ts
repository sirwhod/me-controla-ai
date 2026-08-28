import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { getRequestId, logFirestoreQuery, logHttpRequest } from '@/app/lib/observability'

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const requestId = getRequestId(req)
  const startedAt = performance.now()
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) {
    return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  }
  const search = new URL(req.url).searchParams
  const month = (search.get('month') || MONTHS[new Date().getMonth()]).toLowerCase()
  const year = Number(search.get('year') || new Date().getFullYear())
  if (!MONTHS.includes(month) || !Number.isInteger(year) || year < 2000 || year > 2200) {
    return NextResponse.json({ message: 'Período inválido' }, { status: 400 })
  }
  const base = db.collection('workspaces').doc(workspaceId)
  const [debits, credits, existing] = await Promise.all([
    base.collection('debits').where('month', '==', month).where('year', '==', year).get(),
    base.collection('credits').where('month', '==', month).where('year', '==', year).get(),
    base.collection('summaries').doc(`${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}`).get(),
  ])
  logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/summary', collection: 'debits+credits+summaries', operation: 'monthly.get', documents: debits.size + credits.size + (existing.exists ? 1 : 0), durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'summary.monthly' })
  const totalExpenses = debits.docs.reduce((sum, doc) => sum + Number(doc.data().value || 0), 0)
  const totalIncome = credits.docs.reduce((sum, doc) => sum + Number(doc.data().value || 0), 0)
  const summary = { workspaceId, month, year, totalExpenses, totalIncome, balance: totalIncome - totalExpenses, debitCount: debits.size, creditCount: credits.size, source: 'debits-credits', generatedAt: new Date() }
  const ref = base.collection('summaries').doc(`${year}-${String(MONTHS.indexOf(month) + 1).padStart(2, '0')}`)
  await ref.set(summary, { merge: true })
  logHttpRequest({ requestId, endpoint: '/api/workspaces/:workspaceId/summary', method: 'GET', status: 200, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId })
  return NextResponse.json({ ...summary, generatedAt: summary.generatedAt.toISOString(), status: 'ready' }, { headers: { 'x-request-id': requestId } })
}
