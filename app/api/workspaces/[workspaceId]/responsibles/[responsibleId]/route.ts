import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { updatePersonResponsibleSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { FieldPath } from 'firebase-admin/firestore'
import { calculateResponsibleBalance } from '@/app/lib/responsible-balance'

interface RouteParams {
  params: Promise<{
    workspaceId: string
    responsibleId: string
  }>
}

export async function GET(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId, responsibleId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const requestedLimit = Number(searchParams.get('limit'))
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 100) : 50
    const cursor = searchParams.get('cursor')

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

    // Editing a responsible only needs its registration data. Financial
    // details are loaded exclusively when a complete period is provided.
    const hasMonth = Boolean(month && month !== 'todos')
    const hasYear = Boolean(year && year !== 'todos')
    if (hasMonth !== hasYear) {
      return NextResponse.json({ message: 'Informe mês e ano juntos para consultar os saldos' }, { status: 400 })
    }

    let userImage: string | null = null
    let isRegisteredUser = false
    if (responsibleData.email) {
      const userSnap = await db
        .collection('users')
        .where('email', '==', responsibleData.email.toLowerCase().trim())
        .limit(1)
        .get()
      if (!userSnap.empty) {
        userImage = userSnap.docs[0].data()?.image || null
        isRegisteredUser = true
      }
    }

    const registration = {
      id: responsibleDoc.id,
      workspaceId,
      name: responsibleData.name,
      email: responsibleData.email || null,
      userImage,
      isRegisteredUser,
      status: responsibleData.status || 'active',
      createdAt: serializeFirestoreDate(responsibleData.createdAt),
      updatedAt: serializeFirestoreDate(responsibleData.updatedAt),
    }

    if (!hasMonth && !hasYear) {
      return NextResponse.json(registration, { status: 200 })
    }
    const periodMonth = month as string
    const periodYear = year as string

    // Responsible aggregates from schema v1 do not encode debt direction.
    // Read source entries until a directional aggregate is backfilled.
    const hasAggregate = false

    let debitsQuery: FirebaseFirestore.Query = db.collection('workspaces').doc(workspaceId)
      .collection('debits').where('responsibleId', '==', responsibleId)
    let creditsQuery: FirebaseFirestore.Query = db.collection('workspaces').doc(workspaceId)
      .collection('credits').where('responsibleId', '==', responsibleId)

    debitsQuery = debitsQuery.where('month', '==', periodMonth.toLowerCase()).where('year', '==', Number(periodYear))
    creditsQuery = creditsQuery.where('month', '==', periodMonth.toLowerCase()).where('year', '==', Number(periodYear))
    let decodedCursor: { date: string; id: string } | null = null
    if (cursor) {
      try { decodedCursor = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) }
      catch { return NextResponse.json({ message: 'Cursor inválido' }, { status: 400 }) }
    }
    if (hasAggregate) {
      debitsQuery = debitsQuery.orderBy('date', 'desc').orderBy(FieldPath.documentId(), 'desc')
      if (decodedCursor) debitsQuery = debitsQuery.startAfter(new Date(decodedCursor.date), decodedCursor.id)
      debitsQuery = debitsQuery.limit(pageLimit)
    }
    const [debitsSnap, creditsSnap] = await Promise.all([debitsQuery.get(), hasAggregate ? Promise.resolve(null) : creditsQuery.get()])

    const balanceDebits: FirebaseFirestore.DocumentData[] = []
    const balanceCredits: FirebaseFirestore.DocumentData[] = []
    let pendingDebits: Array<Record<string, unknown>> = []

    for (const doc of debitsSnap.docs) {
      const d = doc.data()

      // Filtro de mês e ano se especificado
      if (month && month !== 'todos' && d.month && d.month.toLowerCase() !== month.toLowerCase()) {
        continue
      }
      if (year && year !== 'todos' && d.year && Number(d.year) !== Number(year)) {
        continue
      }

      balanceDebits.push(d)
      const dateStr = d.date?.toDate ? d.date.toDate().toLocaleDateString('pt-BR') : ''

      pendingDebits.push({
        id: doc.id,
        description: d.description,
        value: d.value,
        date: serializeFirestoreDate(d.date),
        dateFormatted: dateStr,
        paymentMethod: d.paymentMethod,
        categoryName: d.categoryName || null,
        debtDirection: d.debtDirection === 'i_owe_responsible' ? 'i_owe_responsible' : 'responsible_owes_me',
        month: d.month,
        year: d.year,
      })
    }

    for (const doc of creditsSnap?.docs || []) {
      const c = doc.data()
      if (month && month !== 'todos' && c.month && c.month.toLowerCase() !== month.toLowerCase()) {
        continue
      }
      if (year && year !== 'todos' && c.year && Number(c.year) !== Number(year)) {
        continue
      }
      balanceCredits.push(c)
    }

    if (!hasAggregate) {
      pendingDebits = pendingDebits.sort((left, right) => new Date(String(right.date)).getTime() - new Date(String(left.date)).getTime())
      if (decodedCursor) {
        const index = pendingDebits.findIndex((item) => item.id === decodedCursor?.id)
        pendingDebits = index >= 0 ? pendingDebits.slice(index + 1) : []
      }
      pendingDebits = pendingDebits.slice(0, pageLimit)
    }
    const lastDebit = pendingDebits.at(-1)
    const nextCursor = pendingDebits.length === pageLimit && lastDebit
      ? Buffer.from(JSON.stringify({ date: lastDebit.date, id: lastDebit.id })).toString('base64url') : null

    const balance = calculateResponsibleBalance(balanceDebits, balanceCredits)

    return NextResponse.json({
      ...registration,
      totalPending: Number(balance.outstandingReceivable.toFixed(2)),
      totalDebits: Number(balance.expensesResponsibleOwes.toFixed(2)),
      totalCredits: Number(balance.received.toFixed(2)),
      received: Number(balance.received.toFixed(2)),
      appliedReceived: Number(balance.appliedReceived.toFixed(2)),
      overpayment: Number(balance.overpayment.toFixed(2)),
      payable: Number(balance.payable.toFixed(2)),
      receivable: Number(balance.receivable.toFixed(2)),
      outstandingReceivable: Number(balance.outstandingReceivable.toFixed(2)),
      netBalance: Number(balance.netBalance.toFixed(2)),
      pendingDebits,
      pendingCredits: pendingDebits, // Alias para retrocompatibilidade
      nextCursor,
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
    const isMember = await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id })
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
    if (parsed.data.email !== undefined) {
      const emailFormatted = parsed.data.email ? parsed.data.email.toLowerCase().trim() : null
      updateData.email = emailFormatted

      if (emailFormatted) {
        const userSnap = await db
          .collection('users')
          .where('email', '==', emailFormatted)
          .limit(1)
          .get()

        if (!userSnap.empty) {
          updateData.linkedUserId = userSnap.docs[0].id
          updateData.status = 'linked'
        } else {
          updateData.linkedUserId = null
          updateData.status = 'active'
        }
      } else {
        updateData.linkedUserId = null
        updateData.status = 'active'
      }
    }

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
    const isMember = await checkIsWorkspaceMember({ workspaceId, workspaceIds: session.user.workspaceIds, userId: session.user.id })
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
