import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { z } from 'zod'
import { consumeRateLimit } from '@/app/lib/rate-limit'

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

    const inviteeEmail = parsed.data.email.toLowerCase().trim()

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

    // Verificar se já existe convite pendente
    const existingInvite = await db
      .collection('invitations')
      .where('workspaceId', '==', workspaceId)
      .where('inviteeEmail', '==', inviteeEmail)
      .where('status', '==', 'pending')
      .get()

    if (!existingInvite.empty) {
      return NextResponse.json({ message: 'Já existe um convite pendente para este e-mail' }, { status: 400 })
    }

    // Criar convite
    const inviteRef = db.collection('invitations').doc()
    await inviteRef.set({
      workspaceId,
      workspaceName: wsData?.name || 'Caixinha Compartilhada',
      inviterId: session.user.id,
      inviterName: session.user.name || 'Um usuário',
      inviterEmail: session.user.email,
      inviteeEmail,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      message: `Convite enviado com sucesso para ${inviteeEmail}!`,
      invitationId: inviteRef.id,
    }, { status: 201 })
  } catch (error: unknown) {
    console.error('Erro ao enviar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao enviar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}
