import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { createPersonResponsibleSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { getRequestId, logFirestoreQuery } from '@/app/lib/observability'

interface RouteParams {
  params: Promise<{
    workspaceId: string
  }>
}

export async function GET(req: NextRequest, props: RouteParams) {
  const requestId = getRequestId(req)
  const startedAt = performance.now()
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId } = await props.params
    const isMember = await checkIsWorkspaceMember({
      workspaceId,
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const includeBalances = searchParams.get('includeBalances') === 'true'

    const responsiblesSnap = await db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('responsibles')
      .orderBy('name', 'asc')
      .get()
    logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/responsibles', collection: 'responsibles', operation: 'query.get', documents: responsiblesSnap.size, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'responsibles.list' })

    let debitsQuery: FirebaseFirestore.Query = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('debits')
    let creditsQuery: FirebaseFirestore.Query = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('credits')

    if (month && month !== 'todos') {
      debitsQuery = debitsQuery.where('month', '==', month.toLowerCase())
      creditsQuery = creditsQuery.where('month', '==', month.toLowerCase())
    }
    if (year && year !== 'todos') {
      debitsQuery = debitsQuery.where('year', '==', Number(year))
      creditsQuery = creditsQuery.where('year', '==', Number(year))
    }

    const [debitsSnap, creditsSnap] = includeBalances
      ? await Promise.all([debitsQuery.get(), creditsQuery.get()])
      : [null, null]
    if (includeBalances) {
      logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/responsibles', collection: 'debits', operation: 'query.get', documents: debitsSnap?.size || 0, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'responsibles.balance' })
      logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/responsibles', collection: 'credits', operation: 'query.get', documents: creditsSnap?.size || 0, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'responsibles.balance' })
    }

    // Calcular total de despesas e receitas por responsável no período
    const totalDebitsByResp: Record<string, number> = {}
    const totalCreditsByResp: Record<string, number> = {}

    debitsSnap?.docs.forEach((doc) => {
      const data = doc.data()
      if (data.responsibleId) {
        totalDebitsByResp[data.responsibleId] =
          (totalDebitsByResp[data.responsibleId] || 0) + (data.value || 0)
      }
    })

    creditsSnap?.docs.forEach((doc) => {
      const data = doc.data()
      if (data.responsibleId) {
        totalCreditsByResp[data.responsibleId] =
          (totalCreditsByResp[data.responsibleId] || 0) + (data.value || 0)
      }
    })

    const linkedUserIds = Array.from(new Set(
      responsiblesSnap.docs
        .map((doc) => doc.data().linkedUserId as string | undefined)
        .filter((id): id is string => Boolean(id))
    ))
    const linkedUserDocs = linkedUserIds.length > 0
      ? await db.getAll(...linkedUserIds.map((id) => db.collection('users').doc(id)))
      : []
    const linkedUsers = new Map(
      linkedUserDocs
        .filter((doc) => doc.exists)
        .map((doc) => [doc.id, doc.data()])
    )
    const unlinkedEmails = Array.from(new Set(
      responsiblesSnap.docs
        .filter((doc) => !doc.data().linkedUserId && doc.data().email)
        .map((doc) => String(doc.data().email).toLowerCase().trim())
    ))
    const emailChunks = Array.from(
      { length: Math.ceil(unlinkedEmails.length / 30) },
      (_, index) => unlinkedEmails.slice(index * 30, index * 30 + 30)
    )
    const legacyUserSnapshots = await Promise.all(
      emailChunks.map((emails) => db.collection('users').where('email', 'in', emails).get())
    )
    const legacyUsersByEmail = new Map(
      legacyUserSnapshots.flatMap((snapshot) => snapshot.docs.map((doc) => {
        const user = doc.data()
        return [String(user.email).toLowerCase().trim(), user] as const
      }))
    )

    const responsibles = responsiblesSnap.docs.map((doc) => {
        const data = doc.data()
        const normalizedEmail = data.email ? String(data.email).toLowerCase().trim() : null
        const linkedUser = data.linkedUserId
          ? linkedUsers.get(data.linkedUserId)
          : normalizedEmail
            ? legacyUsersByEmail.get(normalizedEmail)
            : undefined
        const isRegisteredUser = Boolean(linkedUser)

        const debitsVal = totalDebitsByResp[doc.id] || 0
        const creditsVal = totalCreditsByResp[doc.id] || 0
        const pendingBalance = Math.max(0, debitsVal - creditsVal)

        return {
          id: doc.id,
          workspaceId,
          name: data.name,
          email: data.email || null,
          userImage: linkedUser?.image || null,
          isRegisteredUser,
          status: isRegisteredUser ? 'linked' : data.status || 'active',
          linkedUserId: data.linkedUserId || null,
          pendingBalance: Number(pendingBalance.toFixed(2)),
          totalDebits: Number(debitsVal.toFixed(2)),
          totalCredits: Number(creditsVal.toFixed(2)),
          createdAt: serializeFirestoreDate(data.createdAt),
          updatedAt: serializeFirestoreDate(data.updatedAt),
        }
      })

    return NextResponse.json(responsibles, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar responsáveis:', error)
    return NextResponse.json({ message: 'Erro interno ao listar responsáveis' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId } = await props.params
    const isMember = await checkIsWorkspaceMember({
      workspaceId,
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createPersonResponsibleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsed.error.format() }, { status: 400 })
    }

    const { name, email } = parsed.data

    let linkedUserId: string | null = null
    let status: 'active' | 'invited' | 'linked' = 'active'

    // Se informou e-mail, verificar se usuário existe na plataforma
    if (email) {
      const userSnap = await db
        .collection('users')
        .where('email', '==', email.toLowerCase().trim())
        .limit(1)
        .get()

      if (!userSnap.empty) {
        linkedUserId = userSnap.docs[0].id
        status = 'linked'
      } else {
        status = 'active'
      }
    }

    const responsibleRef = db.collection('workspaces').doc(workspaceId).collection('responsibles').doc()
    const responsibleData = {
      name,
      email: email ? email.toLowerCase().trim() : null,
      status,
      linkedUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await responsibleRef.set(responsibleData)

    return NextResponse.json({
      message: 'Responsável cadastrado com sucesso!',
      responsibleId: responsibleRef.id,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao cadastrar responsável:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao cadastrar responsável'
    return NextResponse.json({ message }, { status: 500 })
  }
}
