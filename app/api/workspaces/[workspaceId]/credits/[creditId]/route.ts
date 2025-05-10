import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { UpdateCredit, updateCreditSchema } from '@/app/types/financial';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string; creditId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const creditId = params.creditId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)
    const creditDoc = await creditRef.get()

    if (!creditDoc.exists) {
      return NextResponse.json({ message: 'Crédito não encontrado' }, { status: 404 })
    }

    const creditData = creditDoc.data()
    const formattedCredit = {
      id: creditDoc.id,
      ...creditData,
      date: creditData?.date ? creditData.date.toDate() : null, // Convert Timestamp to Date
      createdAt: creditData?.createdAt ? creditData.createdAt.toDate() : null,
      updatedAt: creditData?.updatedAt ? creditData.updatedAt.toDate() : null,
    }

    return NextResponse.json(formattedCredit, { status: 200 })

  } catch (error) {
    console.error(`Erro ao visualizar crédito ${params.creditId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar crédito' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceId: string; creditId: string } }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: { workspaceId: string; creditId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const creditId = params.creditId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updateCreditSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar crédito.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)

    const dataToUpdate: UpdateCredit = { ...updateData }
    if (dataToUpdate.date && typeof dataToUpdate.date === 'string') {
        dataToUpdate.date = new Date(dataToUpdate.date).toDateString()
    }


    await creditRef.update({
        ...dataToUpdate,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Crédito atualizado com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao atualizar crédito ${params.creditId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar crédito' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { workspaceId: string; creditId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const creditId = params.creditId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)

    const creditDoc = await creditRef.get()
    if (!creditDoc.exists) {
        return NextResponse.json({ message: 'Crédito não encontrado para exclusão' }, { status: 404 })
    }

    await creditRef.delete()

    return NextResponse.json({ message: 'Crédito excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao excluir crédito ${params.creditId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir crédito' }, { status: 500 })
  }
}
