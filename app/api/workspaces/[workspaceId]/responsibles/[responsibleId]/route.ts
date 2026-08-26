import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { updatePersonResponsibleSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { formatCurrency } from '@/app/lib/utils'

interface RouteParams {
  params: Promise<{
    workspaceId: string
    responsibleId: string
  }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, responsibleId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const responsibleDoc = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('responsibles')
      .doc(responsibleId)
      .get()

    if (!responsibleDoc.exists) {
      return NextResponse.json({ message: 'Responsável não encontrado' }, { status: 404 })
    }

    const responsibleData = responsibleDoc.data()!

    // Buscar todas as despesas pendentes deste responsável
    const debitsSnap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('debits')
      .where('responsibleId', '==', responsibleId)
      .where('status', '==', 'pending')
      .get()

    let totalPending = 0
    const pendingDebits = debitsSnap.docs.map((doc) => {
      const d = doc.data()
      totalPending += d.value || 0
      const dateStr = d.date?.toDate ? d.date.toDate().toLocaleDateString('pt-BR') : ''
      return {
        id: doc.id,
        description: d.description,
        value: d.value,
        date: serializeFirestoreDate(d.date),
        dateFormatted: dateStr,
        paymentMethod: d.paymentMethod,
        categoryName: d.categoryName || null,
      }
    })

    // Montar texto pronto e formatado para cobrança via WhatsApp / PIX
    const lines = pendingDebits.map(
      (d) => `• ${d.dateFormatted ? d.dateFormatted + ' - ' : ''}${d.description}: ${formatCurrency(d.value)}`
    )

    const pixKeyText = responsibleData.pixKey ? `\n🔑 Chave PIX: ${responsibleData.pixKey}` : ''
    const formattedBillingMessage = [
      `Olá ${responsibleData.name}! Segue o balanço das despesas no MeControla.AI:`,
      ...lines,
      `---------------------------------`,
      `💰 Total: ${formatCurrency(totalPending)}${pixKeyText}`,
      `\nObrigado! 🚀`,
    ].join('\n')

    return NextResponse.json({
      id: responsibleDoc.id,
      workspaceId,
      name: responsibleData.name,
      email: responsibleData.email || null,
      pixKey: responsibleData.pixKey || null,
      pixKeyType: responsibleData.pixKeyType || null,
      status: responsibleData.status || 'active',
      totalPending: Number(totalPending.toFixed(2)),
      pendingDebits,
      formattedBillingMessage,
      createdAt: serializeFirestoreDate(responsibleData.createdAt),
      updatedAt: serializeFirestoreDate(responsibleData.updatedAt),
    }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar responsável:', error)
    return NextResponse.json({ message: 'Erro interno ao buscar responsável' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, responsibleId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updatePersonResponsibleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsed.error.format() }, { status: 400 })
    }

    const responsibleRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('responsibles')
      .doc(responsibleId)

    const doc = await responsibleRef.get()
    if (!doc.exists) {
      return NextResponse.json({ message: 'Responsável não encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email
    if (parsed.data.pixKey !== undefined) updateData.pixKey = parsed.data.pixKey
    if (parsed.data.pixKeyType !== undefined) updateData.pixKeyType = parsed.data.pixKeyType

    await responsibleRef.update(updateData)

    return NextResponse.json({ message: 'Responsável atualizado com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao atualizar responsável:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar responsável'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, responsibleId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const responsibleRef = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('responsibles')
      .doc(responsibleId)

    await responsibleRef.delete()

    return NextResponse.json({ message: 'Responsável excluído com sucesso!' }, { status: 200 })
  } catch (error) {
    console.error('Erro ao excluir responsável:', error)
    return NextResponse.json({ message: 'Erro interno ao excluir responsável' }, { status: 500 })
  }
}
