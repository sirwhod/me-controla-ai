import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { isValidFinancialPeriod } from '@/app/lib/financial-period'
import { getMonthlyFinancialSummary } from '@/app/lib/firestore-financial-summary'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  try {
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
    const totals = await getMonthlyFinancialSummary(workspaceId, year, month)
    return NextResponse.json({
      ...totals,
      balance: totals.totalIncome - totals.totalExpenses,
    })
  } catch (error) {
    console.error('Erro ao calcular analytics do workspace:', error)
    return NextResponse.json({ message: 'Erro interno do servidor ao calcular o resumo financeiro' }, { status: 500 })
  }
}
