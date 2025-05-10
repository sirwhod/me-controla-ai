import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updateBankSchema } from '@/app/types/financial';
import { NextRequest, NextResponse } from 'next/server'

interface BankRouteParams {
  workspaceId: string;
  bankId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<BankRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const bankId = searchParams.bankId

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
    const searchParams = await params
    console.error(`Erro ao visualizar banco ${searchParams.bankId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar banco' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<BankRouteParams> }) {
    return PATCH(req, { params: params }) // Redireciona PUT para PATCH
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<BankRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const bankId = searchParams.bankId

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
    const searchParams = await params
    console.error(`Erro ao atualizar banco ${searchParams.bankId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar banco' }, { status: 500 })
  }
}
 
export async function DELETE(req: NextRequest, { params }: { params: Promise<BankRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const bankId = searchParams.bankId

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
    const searchParams = await params
    console.error(`Erro ao excluir banco ${searchParams.bankId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir banco' }, { status: 500 })
  }
}
