import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const userEmail = session.user.email.toLowerCase().trim()

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

    const inviteRef = db.collection('invitations').doc(invitationId)
    const inviteDoc = await inviteRef.get()

    if (!inviteDoc.exists) {
      return NextResponse.json({ message: 'Convite não encontrado' }, { status: 404 })
    }

    const inviteData = inviteDoc.data()!
    if (inviteData.inviteeEmail.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ message: 'Este convite não pertence a este usuário' }, { status: 403 })
    }

    if (action === 'accept') {
      const workspaceRef = db.collection('workspaces').doc(inviteData.workspaceId)
      const userRef = db.collection('users').doc(session.user.id)

      const batch = db.batch()
      batch.update(inviteRef, {
        status: 'accepted',
        acceptedAt: new Date(),
        updatedAt: new Date(),
      })
      batch.update(workspaceRef, {
        members: FieldValue.arrayUnion(session.user.id),
        type: 'shared',
        updatedAt: new Date(),
      })
      batch.update(userRef, {
        workspaceIds: FieldValue.arrayUnion(inviteData.workspaceId),
        updatedAt: new Date(),
      })

      await batch.commit()

      return NextResponse.json({
        message: `Você agora faz parte da Caixinha "${inviteData.workspaceName}"!`,
        workspaceId: inviteData.workspaceId,
      }, { status: 200 })
    } else {
      await inviteRef.update({
        status: 'rejected',
        rejectedAt: new Date(),
        updatedAt: new Date(),
      })

      return NextResponse.json({ message: 'Convite recusado com sucesso.' }, { status: 200 })
    }
  } catch (error: unknown) {
    console.error('Erro ao processar convite:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao processar convite'
    return NextResponse.json({ message }, { status: 500 })
  }
}
