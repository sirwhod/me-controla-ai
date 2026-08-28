import { NextRequest, NextResponse } from 'next/server'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const year = Number(new URL(req.url).searchParams.get('year') || new Date().getFullYear())
  if (!Number.isInteger(year) || year < 2000 || year > 2200) return NextResponse.json({ message: 'Ano inválido' }, { status: 400 })
  const base = db.collection('workspaces').doc(workspaceId).collection('summaries')
  const snapshots = await db.getAll(...MONTHS.map((_, index) => base.doc(`${year}-${String(index + 1).padStart(2, '0')}`)))
  const result = MONTHS.map((month, index) => {
    const data = snapshots[index].data() || {}
    return { month, year, totalExpenses: Number(data.totalExpenses || 0), totalIncome: Number(data.totalIncome || 0), balance: Number(data.balance || 0), ready: snapshots[index].exists }
  })
  return NextResponse.json(result)
}
