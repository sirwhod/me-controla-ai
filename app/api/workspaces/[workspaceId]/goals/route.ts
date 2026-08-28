import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createGoalSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { NextRequest, NextResponse } from 'next/server'

interface GoalsRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<GoalsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const isMember = await checkIsWorkspaceMember({
      workspaceId, 
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    
    if (!isMember) {
        return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const goalsQuery = db.collection('workspaces').doc(workspaceId).collection('goals')
      .orderBy('startDate', 'asc')

    const querySnapshot = await goalsQuery.get()

    const goals = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
        startDate: serializeFirestoreDate(data.startDate),
        endDate: serializeFirestoreDate(data.endDate),
      }
    })

    return NextResponse.json(goals, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar metas para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar metas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<GoalsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const isMember = await checkIsWorkspaceMember({
      workspaceId, 
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    
    if (!isMember) {
        return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const body = await req.json()
    const validationResult = createGoalSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar meta.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const {
      name,
      targetAmount,
      startDate,
      endDate,
      description,
    } = validationResult.data

    const newGoalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc()

    const newGoalData = {
      name: name.trim(),
      targetAmount: targetAmount,
      currentAmount: 0,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      description: description?.trim() || null,
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newGoalRef.set(newGoalData)

    return NextResponse.json({ message: 'Meta criada com sucesso!', goalId: newGoalRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar meta para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar meta' }, { status: 500 })
  }
}
