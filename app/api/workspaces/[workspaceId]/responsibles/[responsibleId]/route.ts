import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { updatePersonResponsibleSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { FieldPath } from 'firebase-admin/firestore'
import { FINANCIAL_PERIOD_SCHEMA_VERSION, financialPeriodId } from '@/app/lib/financial-periods'

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
    if (!month || month === 'todos' || !year || year === 'todos') {
      return NextResponse.json({ message: 'Mês e ano são obrigatórios para o detalhe' }, { status: 400 })
    }
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

    const workspaceRef = db.collection('workspaces').doc(workspaceId)
    const periodRef = workspaceRef.collection('financialPeriods').doc(financialPeriodId(Number(year), month))
    const [periodDoc, responsiblePeriod] = await Promise.all([periodRef.get(), periodRef.collection('responsibles').doc(responsibleId).get()])
    const hasAggregate = process.env.FINANCIAL_PERIOD_READS_ENABLED === 'true' && periodDoc.data()?.schemaVersion === FINANCIAL_PERIOD_SCHEMA_VERSION

    let debitsQuery: FirebaseFirestore.Query = db.collection('workspaces').doc(workspaceId)
      .collection('debits').where('responsibleId', '==', responsibleId)
    let creditsQuery: FirebaseFirestore.Query = db.collection('workspaces').doc(workspaceId)
      .collection('credits').where('responsibleId', '==', responsibleId)

    debitsQuery = debitsQuery.where('month', '==', month.toLowerCase()).where('year', '==', Number(year))
    creditsQuery = creditsQuery.where('month', '==', month.toLowerCase()).where('year', '==', Number(year))
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

    let totalDebits = 0
    let totalCredits = 0
    let pendingDebits: Array<Record<string, unknown>> = []

    if (hasAggregate) {
      totalDebits = Number(responsiblePeriod.data()?.totalExpensesCents || 0) / 100
      totalCredits = Number(responsiblePeriod.data()?.totalIncomeCents || 0) / 100
    }

    for (const doc of debitsSnap.docs) {
      const d = doc.data()

      // Filtro de mês e ano se especificado
      if (month && month !== 'todos' && d.month && d.month.toLowerCase() !== month.toLowerCase()) {
        continue
      }
      if (year && year !== 'todos' && d.year && Number(d.year) !== Number(year)) {
        continue
      }

      if (!hasAggregate) totalDebits += d.value || 0
      const dateStr = d.date?.toDate ? d.date.toDate().toLocaleDateString('pt-BR') : ''

      pendingDebits.push({
        id: doc.id,
        description: d.description,
        value: d.value,
        date: serializeFirestoreDate(d.date),
        dateFormatted: dateStr,
        paymentMethod: d.paymentMethod,
        categoryName: d.categoryName || null,
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
      totalCredits += c.value || 0
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

    const totalPending = Math.max(0, totalDebits - totalCredits)

    // Verificar se o e-mail corresponde a um usuário cadastrado
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

    return NextResponse.json({
      id: responsibleDoc.id,
      workspaceId,
      name: responsibleData.name,
      email: responsibleData.email || null,
      userImage,
      isRegisteredUser,
      status: responsibleData.status || 'active',
      totalPending: Number(totalPending.toFixed(2)),
      totalDebits: Number(totalDebits.toFixed(2)),
      totalCredits: Number(totalCredits.toFixed(2)),
      pendingDebits,
      pendingCredits: pendingDebits, // Alias para retrocompatibilidade
      nextCursor,
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
        }
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
