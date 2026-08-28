import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

interface RouteParams {
  params: Promise<{ invitationId: string }>
}

export async function DELETE(_req: NextRequest, props: RouteParams) {
  try {
    const { invitationId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const inviteRef = db.collection('invitations').doc(invitationId)
    const doc = await inviteRef.get()

    if (!doc.exists) {
      return NextResponse.json({ message: 'Convite não encontrado' }, { status: 404 })
    }

    const data = doc.data()
    // Invitation administration is owner-only.
    const wsDoc = await db.collection('workspaces').doc(data?.workspaceId).get()
    const isOwner = wsDoc.exists && wsDoc.data()?.ownerId === session.user.id

    if (!isOwner) {
      return NextResponse.json({ message: 'Sem permissão para cancelar este convite' }, { status: 403 })
    }

    if (data?.status !== 'pending') {
      return NextResponse.json({ message: 'Somente convites pendentes podem ser cancelados' }, { status: 409 })
    }

    await inviteRef.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Convite cancelado com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao cancelar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao cancelar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}
