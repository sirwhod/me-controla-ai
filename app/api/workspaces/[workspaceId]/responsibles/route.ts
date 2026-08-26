import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { createPersonResponsibleSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'

interface RouteParams {
  params: Promise<{
    workspaceId: string
  }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const { workspaceId } = await props.params
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const [responsiblesSnap, debitsSnap] = await Promise.all([
      db.collection('workspaces').doc(workspaceId).collection('responsibles').orderBy('name', 'asc').get(),
      db.collection('workspaces').doc(workspaceId).collection('debits').where('status', '==', 'pending').get(),
    ])

    // Calcular total pendente por responsável
    const pendingBalances: Record<string, number> = {}
    debitsSnap.docs.forEach((doc) => {
      const data = doc.data()
      if (data.responsibleId) {
        pendingBalances[data.responsibleId] = (pendingBalances[data.responsibleId] || 0) + (data.value || 0)
      }
    })

    const responsibles = responsiblesSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        workspaceId,
        name: data.name,
        email: data.email || null,
        pixKey: data.pixKey || null,
        pixKeyType: data.pixKeyType || null,
        status: data.status || 'active',
        linkedUserId: data.linkedUserId || null,
        pendingBalance: Number((pendingBalances[doc.id] || 0).toFixed(2)),
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
    const isMember = await checkIsWorkspaceMember({ workspaceId, userId: session.user.id })
    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createPersonResponsibleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: parsed.error.format() }, { status: 400 })
    }

    const { name, email, pixKey, pixKeyType } = parsed.data

    let linkedUserId: string | null = null
    let status: 'active' | 'invited' | 'linked' = 'active'

    // Se informou e-mail, verificar se usuário existe na plataforma
    if (email) {
      const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get()
      if (!userSnap.empty) {
        linkedUserId = userSnap.docs[0].id
        status = 'linked'
      } else {
        status = 'invited'
      }
    }

    const responsibleRef = db.collection('workspaces').doc(workspaceId).collection('responsibles').doc()
    const responsibleData = {
      name,
      email: email ? email.toLowerCase().trim() : null,
      pixKey: pixKey || null,
      pixKeyType: pixKeyType || null,
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
