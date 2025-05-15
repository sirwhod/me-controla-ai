import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { UpdateDebit, updateDebitSchema } from '@/app/types/financial';
import { NextRequest, NextResponse } from 'next/server'

interface CreditsRouteParams {
  workspaceId: string;
  debitId: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const debitId = searchParams.debitId
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

    const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId)
    const debitDoc = await debitRef.get()

    if (!debitDoc.exists) {
      return NextResponse.json({ message: 'Débito não encontrado' }, { status: 404 })
    }

    const debitData = debitDoc.data()
    const formattedDebit = {
      id: debitDoc.id,
      ...debitData,
      date: debitData?.date ? debitData.date.toDate() : null, 
      createdAt: debitData?.createdAt ? debitData.createdAt.toDate() : null,
      updatedAt: debitData?.updatedAt ? debitData.updatedAt.toDate() : null,
      startDate: debitData?.startDate ? debitData.startDate.toDate() : null, 
      endDate: debitData?.endDate ? debitData.endDate.toDate() : null,     
    }

    return NextResponse.json(formattedDebit, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao visualizar débito ${searchParams.debitId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar débito' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const debitId = searchParams.debitId
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
    const validationResult = updateDebitSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar débito.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId)

    const dataToUpdate: UpdateDebit = { ...updateData }

    if (dataToUpdate.date && typeof dataToUpdate.date === 'string') {
        dataToUpdate.date = new Date(dataToUpdate.date).toDateString()
    }
     if (dataToUpdate.startDate && typeof dataToUpdate.startDate === 'string') {
        dataToUpdate.startDate = new Date(dataToUpdate.startDate).toDateString()
    }
    if (dataToUpdate.endDate && typeof dataToUpdate.endDate === 'string') {
         dataToUpdate.endDate = dataToUpdate.endDate.trim() === '' ? null : new Date(dataToUpdate.endDate).toDateString()
    } else if (dataToUpdate.endDate === null) {
         dataToUpdate.endDate = null
    }


    await debitRef.update({
        ...dataToUpdate,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Débito atualizado com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao atualizar débito ${searchParams.debitId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar débito' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const debitId = searchParams.debitId
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

    const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId)

    const debitDoc = await debitRef.get()
    if (!debitDoc.exists) {
        return NextResponse.json({ message: 'Débito não encontrado para exclusão' }, { status: 404 })
    }

    await debitRef.delete()

    return NextResponse.json({ message: 'Débito excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao excluir débito ${searchParams.debitId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir débito' }, { status: 500 })
  }
}
