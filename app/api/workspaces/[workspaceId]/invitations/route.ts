import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { createBoxInvitationSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import crypto from 'crypto'

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

    const invitesSnap = await db
      .collection('invitations')
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get()

    const invitations = invitesSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
      }
    })

    return NextResponse.json(invitations, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar convites da caixinha:', error)
    return NextResponse.json({ message: 'Erro interno ao listar convites' }, { status: 500 })
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
    const parsed = createBoxInvitationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'E-mail inválido', errors: parsed.error.format() }, { status: 400 })
    }

    const inviteeEmail = parsed.data.inviteeEmail.toLowerCase().trim()

    // Buscar informações da Caixinha
    const workspaceDoc = await db.collection('workspaces').doc(workspaceId).get()
    if (!workspaceDoc.exists) {
      return NextResponse.json({ message: 'Caixinha não encontrada' }, { status: 404 })
    }

    const workspaceData = workspaceDoc.data()!
    const token = crypto.randomBytes(24).toString('hex')

    const invitationRef = db.collection('invitations').doc()
    const invitationData = {
      workspaceId,
      workspaceName: workspaceData.name || 'Caixinha Compartilhada',
      inviterId: session.user.id,
      inviterName: session.user.name || 'Usuário',
      inviterEmail: session.user.email || '',
      inviteeEmail,
      status: 'pending',
      token,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await invitationRef.set(invitationData)

    return NextResponse.json({
      message: `Convite enviado para ${inviteeEmail} com sucesso!`,
      invitationId: invitationRef.id,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao enviar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao enviar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}
