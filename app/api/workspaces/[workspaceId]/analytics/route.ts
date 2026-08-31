import { NextRequest, NextResponse } from 'next/server'
import { AggregateField } from 'firebase-admin/firestore'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

const MONTHS = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const search = new URL(req.url).searchParams
  const month = (search.get('month') || '').toLowerCase()
  const year = Number(search.get('year'))
  if (!MONTHS.includes(month) || !Number.isInteger(year) || year < 2000 || year > 2200) {
    return NextResponse.json({ message: 'Período inválido' }, { status: 400 })
  }
  const base = db.collection('workspaces').doc(workspaceId)
  const build = (collection: 'debits' | 'credits') => {
    return base
      .collection(collection)
      .where('month', '==', month)
      .where('year', '==', year)
      .aggregate({ total: AggregateField.sum('value'), count: AggregateField.count() })
      .get()
  }
  const [debits, credits] = await Promise.all([build('debits'), build('credits')])
  return NextResponse.json({ totalExpenses: Number(debits.data().total || 0), totalIncome: Number(credits.data().total || 0), debitCount: debits.data().count, creditCount: credits.data().count, balance: Number(credits.data().total || 0) - Number(debits.data().total || 0) })
}
