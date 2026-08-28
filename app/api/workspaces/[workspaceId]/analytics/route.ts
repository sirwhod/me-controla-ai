import { NextRequest, NextResponse } from 'next/server'
import { AggregateField } from 'firebase-admin/firestore'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

export async function GET(req: NextRequest, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  if (!(await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id }))) return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
  const search = new URL(req.url).searchParams
  const month = search.get('month')
  const year = Number(search.get('year'))
  const applyPeriod = Boolean(month && month !== 'todos' && Number.isInteger(year))
  const base = db.collection('workspaces').doc(workspaceId)
  const build = (collection: 'debits' | 'credits') => {
    let query: FirebaseFirestore.Query = base.collection(collection)
    if (applyPeriod) query = query.where('month', '==', month!.toLowerCase()).where('year', '==', year)
    return query.aggregate({ total: AggregateField.sum('value'), count: AggregateField.count() }).get()
  }
  const [debits, credits] = await Promise.all([build('debits'), build('credits')])
  return NextResponse.json({ totalExpenses: Number(debits.data().total || 0), totalIncome: Number(credits.data().total || 0), debitCount: debits.data().count, creditCount: credits.data().count, balance: Number(credits.data().total || 0) - Number(debits.data().total || 0) })
}
