import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { InvitationError, processInvitationAction } from '@/app/lib/invitations'
import { normalizeEmail } from '@/app/lib/email-identity'
import { createNotification } from '@/app/lib/notifications'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const userDoc = await db.collection('users').doc(session.user.id).get()
    if (!userDoc.exists || !(userDoc.data()?.emailVerifiedAt ?? userDoc.data()?.emailVerified)) {
      return NextResponse.json({ message: 'Verifique seu e-mail antes de acessar convites' }, { status: 403 })
    }
    const userEmail = normalizeEmail(String(userDoc.data()?.email || ''))

    const invitesSnap = await db
      .collection('invitations')
      .where('inviteeEmail', '==', userEmail)
      .where('status', '==', 'pending')
      .get()

    const invitations = invitesSnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        inviterName: data.inviterName,
        inviterEmail: data.inviterEmail,
        inviteeEmail: data.inviteeEmail,
        status: data.status,
        createdAt: serializeFirestoreDate(data.createdAt),
      }
    })

    return NextResponse.json(invitations, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar convites pendentes do usuário:', error)
    return NextResponse.json({ message: 'Erro interno ao buscar convites' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { invitationId, action } = body

    if (!invitationId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Ação ou ID inválido' }, { status: 400 })
    }

    const result = await processInvitationAction({
      invitationId,
      action,
      userId: session.user.id,
    })

    if (action === 'accept' && result.workspaceId) {
      await createNotification({ userId: session.user.id, type: 'workspace.invitation_accepted', category: 'workspace', title: 'Convite aceito', body: `Você agora participa da caixinha "${result.workspaceName}".`, workspaceId: result.workspaceId, actionUrl: `/${result.workspaceId}/dashboard`, dedupeKey: `invitation-accepted:${invitationId}` })
    }

    if (action === 'accept') {

      return NextResponse.json({
        message: `Você agora faz parte da Caixinha "${result.workspaceName}"!`,
        workspaceId: result.workspaceId,
      }, { status: 200 })
    } else {
      return NextResponse.json({ message: 'Convite recusado com sucesso.' }, { status: 200 })
    }
  } catch (error: unknown) {
    if (error instanceof InvitationError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    console.error('Erro ao processar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao processar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}
