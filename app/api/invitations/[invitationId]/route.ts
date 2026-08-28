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
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(inviteRef)
      if (!doc.exists) throw new InvitationRouteError('Convite não encontrado', 404)
      const data = doc.data()!
      const wsDoc = await transaction.get(db.collection('workspaces').doc(data.workspaceId))
      if (!wsDoc.exists || wsDoc.data()?.ownerId !== session.user.id) {
        throw new InvitationRouteError('Sem permissão para cancelar este convite', 403)
      }
      if (data.status !== 'pending') {
        throw new InvitationRouteError('Somente convites pendentes podem ser cancelados', 409)
      }
      transaction.update(inviteRef, { status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
    })

    return NextResponse.json({ message: 'Convite cancelado com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof InvitationRouteError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    console.error('Erro ao cancelar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao cancelar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}

class InvitationRouteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}
