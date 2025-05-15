import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createGoalSchema } from '@/app/types/financial'
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
      workspaceIds: session.user.workspaceIds
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
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        startDate: data.startDate ? data.startDate.toDate() : null,
        endDate: data.endDate ? data.endDate.toDate() : null,
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
      workspaceIds: session.user.workspaceIds
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

    const { name, targetAmount, startDate, endDate, description, userId } = validationResult.data

    const startDateObj = new Date(startDate)
    const endDateObj = endDate ? new Date(endDate) : null

    if (startDateObj && endDateObj && endDateObj < startDateObj) {
        return NextResponse.json({ message: 'Data de término não pode ser anterior à data de início.' }, { status: 400 })
    }

    const newGoalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc()

    const newGoalData = {
      name: name.trim(),
      targetAmount: targetAmount,
      currentAmount: 0,
      startDate: startDateObj,
      endDate: endDateObj,
      description: description?.trim() || null,
      userId: userId || null,
      workspaceId: workspaceId,
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