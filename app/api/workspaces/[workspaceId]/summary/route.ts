import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { getMonthlyFinancialSummary } from '@/app/lib/firestore-financial-summary'
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
  const totals = await getMonthlyFinancialSummary(workspaceId, year, month)
  logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/summary', collection: totals.source === 'aggregate' ? 'financialPeriods' : 'debits+credits', operation: 'monthly.get', documents: totals.source === 'aggregate' ? 1 : totals.debitCount + totals.creditCount, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: totals.source === 'aggregate' ? 'summary.monthly' : 'aggregate-fallback', queries: totals.source === 'aggregate' ? 1 : 3 })
  const summary = { workspaceId, month, year, ...totals, balance: totals.totalIncome - totals.totalExpenses }
  logHttpRequest({ requestId, endpoint: '/api/workspaces/:workspaceId/summary', method: 'GET', status: 200, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId })
  return NextResponse.json({ ...summary, status: 'ready' }, { headers: { 'x-request-id': requestId, 'x-summary-source': totals.source } })
}
