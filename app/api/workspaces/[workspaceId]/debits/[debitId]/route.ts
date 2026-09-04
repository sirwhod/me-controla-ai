import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updateDebitSchema } from '@/app/types/financial';
import { serializeFirestoreDate } from '@/app/lib/date-utils';
import { NextRequest, NextResponse } from 'next/server'
import { calculateEntryDeltas, writeFinancialPeriodDeltas } from '@/app/lib/financial-periods'
import { validateWorkspaceReferences } from '@/app/api/utils/validate-workspace-references'
import { notifyWorkspaceFinancialEvent } from '@/app/lib/financial-notifications'

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
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
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
      date: serializeFirestoreDate(debitData?.date), 
      createdAt: serializeFirestoreDate(debitData?.createdAt),
      updatedAt: serializeFirestoreDate(debitData?.updatedAt),
      startDate: serializeFirestoreDate(debitData?.startDate), 
      endDate: serializeFirestoreDate(debitData?.endDate),     
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
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
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

    await validateWorkspaceReferences(workspaceId, [
      { collection: 'banks', id: updateData.bankId, field: 'bankId' },
      { collection: 'cards', id: updateData.creditCardId, field: 'creditCardId' },
      { collection: 'categories', id: updateData.categoryId, field: 'categoryId' },
      { collection: 'responsibles', id: updateData.responsibleId, field: 'responsibleId' },
    ])

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId)
    const debitDoc = await debitRef.get()

    if (!debitDoc.exists) {
      return NextResponse.json({ message: 'Débito não encontrado' }, { status: 404 })
    }

    const dataToUpdate: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date(),
    }

    // Se tiver creditCardId mas não bankId, buscar o banco do cartão
    if (updateData.creditCardId && !updateData.bankId) {
      const cardDoc = await db.collection('workspaces').doc(workspaceId).collection('cards').doc(updateData.creditCardId).get()
      if (cardDoc.exists && cardDoc.data()?.bankId) {
        dataToUpdate.bankId = cardDoc.data()?.bankId
      }
    }

    const finalBankId = (dataToUpdate.bankId ?? updateData.bankId) as string | null | undefined
    if (finalBankId) {
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(finalBankId)
      const bankDoc = await bankRef.get()
      if (bankDoc.exists) {
        dataToUpdate.bankName = bankDoc.data()?.name || ""
        dataToUpdate.bankImageUrl = bankDoc.data()?.iconUrl || ""
      }
    } else if (finalBankId === null) {
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
      dataToUpdate.debtDirection = null
    }

    if (updateData.debtDirection && !dataToUpdate.responsibleId && !debitDoc.data()?.responsibleId) {
      return NextResponse.json({ message: 'Selecione um responsável para informar a direção da dívida' }, { status: 400 })
    }

    if (updateData.date) {
      const dateObj = new Date(updateData.date)
      dataToUpdate.date = dateObj
      dataToUpdate.month = dateObj.toLocaleString('pt-BR', { month: 'long' })
      dataToUpdate.year = dateObj.getFullYear()
    }

    if (updateData.startDate) {
      dataToUpdate.startDate = new Date(updateData.startDate)
    }

    if (updateData.endDate) {
      dataToUpdate.endDate = updateData.endDate.trim() === '' ? null : new Date(updateData.endDate)
    } else if (updateData.endDate === null) {
      dataToUpdate.endDate = null
    }

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(debitRef)
      if (!current.exists) throw new Error('Débito não encontrado')
      const previous = current.data() || {}
      transaction.update(debitRef, dataToUpdate as FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData>)
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('debit', previous, { ...previous, ...dataToUpdate }))
    })
    await notifyWorkspaceFinancialEvent({ workspaceId, actorUserId: session.user.id, kind: 'updated', entryType: 'despesa', description: String(dataToUpdate.description || debitDoc.data()?.description || ''), entryId: debitId })

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
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    
    if (!isMember) {
       return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const debitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc(debitId)

    const debitDoc = await debitRef.get()
    if (!debitDoc.exists) {
        return NextResponse.json({ message: 'Débito não encontrado para exclusão' }, { status: 404 })
    }

    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(debitRef)
      if (!current.exists) throw new Error('Débito não encontrado')
      transaction.delete(debitRef)
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('debit', current.data(), null))
    })
    await notifyWorkspaceFinancialEvent({ workspaceId, actorUserId: session.user.id, kind: 'deleted', entryType: 'despesa', description: String(debitDoc.data()?.description || ''), entryId: debitId })

    return NextResponse.json({ message: 'Débito excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao excluir débito ${searchParams.debitId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir débito' }, { status: 500 })
  }
}
