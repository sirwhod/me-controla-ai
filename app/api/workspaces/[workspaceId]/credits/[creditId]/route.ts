import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updateCreditSchema } from '@/app/types/financial';
import { serializeFirestoreDate } from '@/app/lib/date-utils';
import { NextRequest, NextResponse } from 'next/server'
import { calculateEntryDeltas, writeFinancialPeriodDeltas } from '@/app/lib/financial-periods'
import { validateWorkspaceReferences } from '@/app/api/utils/validate-workspace-references'

interface CreditsRouteParams {
  workspaceId: string
  creditId: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const creditId = searchParams.creditId
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

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)
    const creditDoc = await creditRef.get()

    if (!creditDoc.exists) {
      return NextResponse.json({ message: 'Crédito não encontrado' }, { status: 404 })
    }

    const creditData = creditDoc.data()
    const formattedCredit = {
      id: creditDoc.id,
      ...creditData,
      date: serializeFirestoreDate(creditData?.date),
      createdAt: serializeFirestoreDate(creditData?.createdAt),
      updatedAt: serializeFirestoreDate(creditData?.updatedAt),
    }

    return NextResponse.json(formattedCredit, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao visualizar crédito ${searchParams.creditId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar crédito' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const creditId = searchParams.creditId
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
    const validationResult = updateCreditSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar crédito.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    await validateWorkspaceReferences(workspaceId, [
      { collection: 'banks', id: updateData.bankId, field: 'bankId' },
      { collection: 'categories', id: updateData.categoryId, field: 'categoryId' },
      { collection: 'responsibles', id: updateData.responsibleId, field: 'responsibleId' },
    ])

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)
    const creditDoc = await creditRef.get()

    if (!creditDoc.exists) {
      return NextResponse.json({ message: 'Crédito não encontrado' }, { status: 404 })
    }

    const dataToUpdate: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date(),
    }

    if (updateData.bankId) {
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(updateData.bankId)
      const bankDoc = await bankRef.get()
      if (bankDoc.exists) {
        dataToUpdate.bankName = bankDoc.data()?.name || ""
        dataToUpdate.bankImageUrl = bankDoc.data()?.iconUrl || ""
      }
    } else if (updateData.bankId === null) {
      dataToUpdate.bankName = null
      dataToUpdate.bankImageUrl = null
    }

    if (updateData.categoryId) {
      const catRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(updateData.categoryId)
      const catDoc = await catRef.get()
      if (catDoc.exists) {
        dataToUpdate.categoryName = catDoc.data()?.name || ""
        dataToUpdate.categoryUrl = catDoc.data()?.icon || ""
      }
    } else if (updateData.categoryId === null) {
      dataToUpdate.categoryName = null
      dataToUpdate.categoryUrl = null
    }

    if (updateData.responsibleId) {
      const respDoc = await db.collection('workspaces').doc(workspaceId).collection('responsibles').doc(updateData.responsibleId).get()
      if (respDoc.exists) {
        dataToUpdate.responsibleName = respDoc.data()?.name || ""
      }
    } else if (updateData.responsibleId === null || updateData.responsibleId === '') {
      dataToUpdate.responsibleId = null
      dataToUpdate.responsibleName = null
    }

    if (updateData.date) {
      const dateObj = new Date(updateData.date)
      dataToUpdate.date = dateObj
      dataToUpdate.month = dateObj.toLocaleString('pt-BR', { month: 'long' })
      dataToUpdate.year = dateObj.getFullYear()
    }

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(creditRef)
      if (!current.exists) throw new Error('Crédito não encontrado')
      const previous = current.data() || {}
      transaction.update(creditRef, dataToUpdate as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('credit', previous, { ...previous, ...dataToUpdate }))
    })

    return NextResponse.json({ message: 'Crédito atualizado com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao atualizar crédito ${searchParams.creditId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar crédito' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const creditId = searchParams.creditId
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

    const creditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc(creditId)

    const creditDoc = await creditRef.get()
    if (!creditDoc.exists) {
        return NextResponse.json({ message: 'Crédito não encontrado para exclusão' }, { status: 404 })
    }

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(creditRef)
      if (!current.exists) throw new Error('Crédito não encontrado')
      transaction.delete(creditRef)
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('credit', current.data(), null))
    })

    return NextResponse.json({ message: 'Crédito excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao excluir crédito ${searchParams.creditId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir crédito' }, { status: 500 })
  }
}
