import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { z } from 'zod'
import { consumeRateLimit } from '@/app/lib/rate-limit'
import { createHash } from 'node:crypto'
import { normalizeEmail } from '@/app/lib/email-identity'
import { enqueueWorkspaceInvitationEmail, processEmailOutbox } from '@/app/lib/email/outbox'
import { createNotification } from '@/app/lib/notifications'

const inviteMemberSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

export async function POST(req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId } = await props.params
    const session = await auth()

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const wsDoc = await db.collection('workspaces').doc(workspaceId).get()
    if (!wsDoc.exists) {
      return NextResponse.json({ message: 'Caixinha não encontrada' }, { status: 404 })
    }
    if (wsDoc.data()?.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Apenas o proprietário pode convidar membros' }, { status: 403 })
    }
    const rateLimit = await consumeRateLimit('invite', `${session.user.id}:${workspaceId}`, 20, 60 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Limite de convites excedido' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      )
    }

    const body = await req.json()
    const parsed = inviteMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'E-mail inválido' }, { status: 400 })
    }

    const inviteeEmail = normalizeEmail(parsed.data.email)

    if (inviteeEmail === session.user.email.toLowerCase()) {
      return NextResponse.json({ message: 'Você já é o proprietário/membro desta caixinha' }, { status: 400 })
    }

    const wsData = wsDoc.data()

    // Verificar se usuário convidado já é membro
    const userSnap = await db.collection('users').where('email', '==', inviteeEmail).get()
    if (!userSnap.empty) {
      const targetUserId = userSnap.docs[0].id
      if (wsData?.members?.includes(targetUserId) || wsData?.ownerId === targetUserId) {
        return NextResponse.json({ message: 'Este usuário já possui acesso a esta caixinha' }, { status: 400 })
      }
    }

    const inviteId = createHash('sha256').update(`${workspaceId}:${inviteeEmail}`).digest('hex')
    const inviteRef = db.collection('invitations').doc(inviteId)
    await db.runTransaction(async (transaction) => {
      const [currentWorkspace, currentInvite] = await Promise.all([
        transaction.get(db.collection('workspaces').doc(workspaceId)),
        transaction.get(inviteRef),
      ])
      if (!currentWorkspace.exists || currentWorkspace.data()?.ownerId !== session.user.id) {
        throw new InvitationCreationError('Apenas o proprietário pode convidar membros', 403)
      }
      const currentData = currentInvite.data()
      const currentExpiry = currentData?.expiresAt?.toDate?.() ??
        (currentData?.expiresAt ? new Date(currentData.expiresAt) : null)
      if (currentData?.status === 'pending' && currentExpiry && currentExpiry.getTime() > Date.now()) {
        throw new InvitationCreationError('Já existe um convite pendente para este e-mail', 409)
      }
      transaction.set(inviteRef, {
        workspaceId,
        workspaceName: currentWorkspace.data()?.name || 'Caixinha Compartilhada',
        inviterId: session.user.id,
        inviterName: session.user.name || 'Um usuário',
        inviterEmail: session.user.email,
        inviteeEmail,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    if (!userSnap.empty) {
      await createNotification({ userId: userSnap.docs[0].id, type: 'workspace.invitation_created', category: 'workspace', title: 'Novo convite para uma caixinha', body: `${session.user.name || 'Um usuário'} convidou você para participar de "${wsData?.name || 'Caixinha Compartilhada'}".`, workspaceId, actionUrl: '/dashboard', dedupeKey: `invitation-created:${inviteId}` })
    }

    try {
      const jobId = await enqueueWorkspaceInvitationEmail({
        to: inviteeEmail,
        inviterName: session.user.name || 'Um usuário',
        workspaceName: wsData?.name || 'Caixinha Compartilhada',
        invitationId: inviteId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      // O envio é disparado pelo fluxo oficial, mas continua protegido pela
      // outbox e pode ser reprocessado pelo worker em caso de falha.
      await processEmailOutbox(1, jobId)
    } catch (outboxError) {
      // O convite já foi confirmado; uma indisponibilidade transitória da outbox
      // não deve desfazer a mutation principal.
      console.error('Convite criado, mas não foi possível enfileirar o e-mail:', outboxError)
    }

    return NextResponse.json({
      message: `Convite criado com sucesso para ${inviteeEmail}. O e-mail será enviado em breve.`,
      invitationId: inviteId,
    }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof InvitationCreationError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    console.error('Erro ao enviar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao enviar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}

class InvitationCreationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}
