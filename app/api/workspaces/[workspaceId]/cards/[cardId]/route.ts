import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { updateCreditCardSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'

interface RouteParams {
  params: Promise<{ workspaceId: string; cardId: string }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId, cardId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
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

    const doc = await db.collection('workspaces').doc(workspaceId).collection('cards').doc(cardId).get()
    if (!doc.exists) {
      return NextResponse.json({ message: 'Cartão não encontrado' }, { status: 404 })
    }

    const data = doc.data()
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: serializeFirestoreDate(data?.createdAt),
      updatedAt: serializeFirestoreDate(data?.updatedAt),
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao buscar cartão:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId, cardId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
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
    const parsed = updateCreditCardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsed.error.flatten() }, { status: 400 })
    }

    const cardRef = db.collection('workspaces').doc(workspaceId).collection('cards').doc(cardId)
    const doc = await cardRef.get()
    if (!doc.exists) {
      return NextResponse.json({ message: 'Cartão não encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.last4Digits !== undefined) updateData.last4Digits = parsed.data.last4Digits || null
    if (parsed.data.limit !== undefined) updateData.limit = parsed.data.limit
    if (parsed.data.closingDay !== undefined) updateData.closingDay = parsed.data.closingDay
    if (parsed.data.dueDay !== undefined) updateData.dueDay = parsed.data.dueDay
    if (parsed.data.color !== undefined) updateData.color = parsed.data.color

    if (parsed.data.bankId) {
      updateData.bankId = parsed.data.bankId
      const bankDoc = await db.collection('workspaces').doc(workspaceId).collection('banks').doc(parsed.data.bankId).get()
      if (bankDoc.exists) {
        updateData.bankName = bankDoc.data()?.name || ''
      }
    }

    await cardRef.update(updateData)

    return NextResponse.json({ message: 'Cartão atualizado com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao atualizar cartão:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar cartão'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId, cardId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
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

    await db.collection('workspaces').doc(workspaceId).collection('cards').doc(cardId).delete()

    return NextResponse.json({ message: 'Cartão excluído com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao excluir cartão:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao excluir cartão'
    return NextResponse.json({ message }, { status: 500 })
  }
}
