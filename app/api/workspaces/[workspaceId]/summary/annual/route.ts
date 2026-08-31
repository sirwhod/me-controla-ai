import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'
import { getYearlyFinancialSummary } from '@/app/lib/firestore-financial-summary'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const year = Number(new URL(req.url).searchParams.get('year') || new Date().getFullYear())
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return NextResponse.json({ message: 'Ano inválido' }, { status: 400 })
  const totalsByMonth = await getYearlyFinancialSummary(workspaceId, year)
  const result = FINANCIAL_MONTHS.map((month) => {
    const totals = totalsByMonth.get(month)!
    return {
      month,
      year,
      totalExpenses: totals.totalExpenses,
      totalIncome: totals.totalIncome,
      balance: totals.totalIncome - totals.totalExpenses,
      ready: true,
    }
  })
  return NextResponse.json(result)
}
