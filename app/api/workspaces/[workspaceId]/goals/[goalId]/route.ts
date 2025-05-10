import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateGoalSchema = z.object({
  name: z.string().min(1, { message: 'O nome da meta não pode ser vazio.' }).optional(),
  targetAmount: z.number().positive({ message: 'O valor alvo da meta deve ser positivo.' }).optional(),
  currentAmount: z.number().min(0, { message: 'O progresso atual não pode ser negativo.' }).optional(),
  startDate: z.string().datetime({ message: 'Data de início inválida.' }).optional(),
  endDate: z.string().datetime({ message: 'Data de término inválida.' }).optional().or(z.literal('')).nullable(),
  description: z.string().optional().or(z.literal('')).nullable(),
  userId: z.string().optional().nullable(),
})

type Goal = z.infer<typeof updateGoalSchema>

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string; goalId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const goalId = params.goalId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc(goalId)
    const goalDoc = await goalRef.get()

    if (!goalDoc.exists) {
      return NextResponse.json({ message: 'Meta não encontrada' }, { status: 404 })
    }

    const goalData = goalDoc.data()
    const formattedGoal = {
      id: goalDoc.id,
      ...goalData,
      createdAt: goalData?.createdAt ? goalData.createdAt.toDate() : null,
      updatedAt: goalData?.updatedAt ? goalData.updatedAt.toDate() : null,
      startDate: goalData?.startDate ? goalData.startDate.toDate() : null,
      endDate: goalData?.endDate ? goalData.endDate.toDate() : null,
    }

    return NextResponse.json(formattedGoal, { status: 200 })

  } catch (error) {
    console.error(`Erro ao visualizar meta ${params.goalId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar meta' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceId: string; goalId: string } }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: { workspaceId: string; goalId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const goalId = params.goalId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updateGoalSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar meta.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (updateData.startDate && updateData.endDate) {
        const startDateObj = new Date(updateData.startDate)
        const endDateObj = new Date(updateData.endDate)
        if (endDateObj < startDateObj) {
            return NextResponse.json({ message: 'Data de término não pode ser anterior à data de início.' }, { status: 400 })
        }
    }


    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc(goalId)

    const dataToUpdate: Goal = { ...updateData }
    if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string') {
        dataToUpdate.startDate = new Date(dataToUpdate.startDate).toDateString()
    }
    if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string') {
         dataToUpdate.endDate = dataToUpdate.endDate.trim() === '' ? null : new Date(dataToUpdate.endDate).toDateString()
    } else if (dataToUpdate.endDate === null) {
         dataToUpdate.endDate = null
    }


    await goalRef.update({
        ...dataToUpdate,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Meta atualizada com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao atualizar meta ${params.goalId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar meta' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { workspaceId: string; goalId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const goalId = params.goalId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const goalRef = db.collection('workspaces').doc(workspaceId).collection('goals').doc(goalId)

    const goalDoc = await goalRef.get()
    if (!goalDoc.exists) {
        return NextResponse.json({ message: 'Meta não encontrada para exclusão' }, { status: 404 })
    }

    await goalRef.delete()

    return NextResponse.json({ message: 'Meta excluída com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao excluir meta ${params.goalId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir meta' }, { status: 500 })
  }
}
