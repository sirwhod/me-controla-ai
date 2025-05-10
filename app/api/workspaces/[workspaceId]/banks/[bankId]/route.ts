import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updateBankSchema } from '@/app/types/financial';
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string; bankId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const bankId = params.bankId

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
    const bankDoc = await bankRef.get()

    if (!bankDoc.exists) {
      return NextResponse.json({ message: 'Banco não encontrado' }, { status: 404 })
    }

    const bankData = bankDoc.data()
    const formattedBank = {
      id: bankDoc.id,
      ...bankData,
      createdAt: bankData?.createdAt ? bankData.createdAt.toDate() : null,
      updatedAt: bankData?.updatedAt ? bankData.updatedAt.toDate() : null,
    }

    return NextResponse.json(formattedBank, { status: 200 })

  } catch (error) {
    console.error(`Erro ao visualizar banco ${params.bankId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar banco' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceId: string; bankId: string } }) {
    return PATCH(req, { params }) // Redireciona PUT para PATCH
}

export async function PATCH(req: NextRequest, { params }: { params: { workspaceId: string; bankId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const bankId = params.bankId

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updateBankSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar banco.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)

    await bankRef.update({
        ...updateData,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Banco atualizado com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao atualizar banco ${params.bankId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar banco' }, { status: 500 })
  }
}
 
export async function DELETE(req: NextRequest, { params }: { params: { workspaceId: string; bankId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const bankId = params.bankId

    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)

    const bankDoc = await bankRef.get()
    if (!bankDoc.exists) {
        return NextResponse.json({ message: 'Banco não encontrado para exclusão' }, { status: 404 })
    }

    await bankRef.delete()

    return NextResponse.json({ message: 'Banco excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    console.error(`Erro ao excluir banco ${params.bankId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir banco' }, { status: 500 })
  }
}
