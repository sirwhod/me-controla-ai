import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { createCreditCardSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId } = await props.params
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

    const snapshot = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('cards')
      .orderBy('name', 'asc')
      .get()

    const cards = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        workspaceId,
        bankId: data.bankId,
        bankName: data.bankName || '',
        name: data.name,
        last4Digits: data.last4Digits || null,
        limit: data.limit || null,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        color: data.color || null,
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
      }
    })

    return NextResponse.json(cards, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao listar cartões de crédito:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao listar cartões'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId } = await props.params
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
    const parsed = createCreditCardSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { bankId, name, last4Digits, limit, closingDay, dueDay, color } = parsed.data

    // Buscar nome do banco
    let bankName = ''
    if (bankId) {
      const bankDoc = await db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId).get()
      if (bankDoc.exists) {
        bankName = bankDoc.data()?.name || ''
      }
    }

    const cardRef = db.collection('workspaces').doc(workspaceId).collection('cards').doc()
    const cardData = {
      workspaceId,
      userId: session.user.id,
      bankId,
      bankName,
      name: name.trim(),
      last4Digits: last4Digits || null,
      limit: limit || null,
      closingDay,
      dueDay,
      color: color || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await cardRef.set(cardData)

    return NextResponse.json(
      { message: 'Cartão de crédito cadastrado com sucesso!', cardId: cardRef.id },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Erro ao cadastrar cartão de crédito:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao cadastrar cartão'
    return NextResponse.json({ message }, { status: 500 })
  }
}
