import { NextRequest, NextResponse } from 'next/server'
import { AggregateField } from 'firebase-admin/firestore'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { FINANCIAL_MONTHS } from '@/app/lib/financial-period'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const year = Number(new URL(req.url).searchParams.get('year') || new Date().getFullYear())
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return NextResponse.json({ message: 'Ano inválido' }, { status: 400 })
  const workspace = db.collection('workspaces').doc(workspaceId)
  const aggregateMonth = async (collection: 'debits' | 'credits', month: string) => {
    const result = await workspace
      .collection(collection)
      .where('month', '==', month)
      .where('year', '==', year)
      .aggregate({ total: AggregateField.sum('value') })
      .get()

    return Number(result.data().total || 0)
  }
  const monthlyTotals = await Promise.all(
    FINANCIAL_MONTHS.map(async (month) => {
      const [totalExpenses, totalIncome] = await Promise.all([
        aggregateMonth('debits', month),
        aggregateMonth('credits', month),
      ])

      return {
        month,
        year,
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
        ready: true,
      }
    }),
  )

  const result = monthlyTotals
  return NextResponse.json(result)
}
