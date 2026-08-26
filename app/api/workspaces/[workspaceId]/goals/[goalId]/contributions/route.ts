import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { createGoalContributionSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'

interface RouteParams {
  params: Promise<{
    workspaceId: string
    goalId: string
  }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, goalId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const contributionsSnap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('goals')
      .doc(goalId)
      .collection('contributions')
      .orderBy('date', 'desc')
      .get()

    const contributions = contributionsSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        goalId,
        workspaceId,
        userId: data.userId,
        value: data.value,
        description: data.description || null,
        date: serializeFirestoreDate(data.date),
        createdAt: serializeFirestoreDate(data.createdAt),
      }
    })

    return NextResponse.json(contributions, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar aportes da meta:', error)
    return NextResponse.json({ message: 'Erro interno ao listar aportes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, goalId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createGoalContributionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsed.error.format() }, { status: 400 })
    }

    const { value, date, description } = parsed.data

    const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc(goalId)
    const contributionRef = goalRef.collection('contributions').doc()

    const contributionData = {
      goalId,
      workspaceId,
      userId: session.user.id,
      value,
      date: new Date(date),
      description: description || null,
      createdAt: new Date(),
    }

    // Usar transaction para atualizar o saldo atual da meta atomically
    await db.runTransaction(async (transaction) => {
      const goalDoc = await transaction.get(goalRef)
      if (!goalDoc.exists) {
        throw new Error('Meta não encontrada')
      }

      const currentAmount = goalDoc.data()?.currentAmount || 0
      const newAmount = Number((currentAmount + value).toFixed(2))

      transaction.set(contributionRef, contributionData)
      transaction.update(goalRef, {
        currentAmount: newAmount,
        updatedAt: new Date(),
      })
    })

    return NextResponse.json({
      message: 'Aporte realizado com sucesso!',
      contributionId: contributionRef.id,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao registrar aporte:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao registrar aporte'
    return NextResponse.json({ message }, { status: 500 })
  }
}
