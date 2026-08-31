import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { isValidFinancialPeriod } from '@/app/lib/financial-period'
import { getYearlyFinancialSummary } from '@/app/lib/firestore-financial-summary'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const search = new URL(req.url).searchParams
  const month = (search.get('month') || '').toLowerCase()
  const year = Number(search.get('year'))
  if (!isValidFinancialPeriod(month, year)) {
    return NextResponse.json({ message: 'Período inválido' }, { status: 400 })
  }
  const totals = (await getYearlyFinancialSummary(workspaceId, year)).get(month)!
  return NextResponse.json({
    ...totals,
    balance: totals.totalIncome - totals.totalExpenses,
  })
}
