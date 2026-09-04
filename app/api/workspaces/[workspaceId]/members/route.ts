import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { FieldValue } from 'firebase-admin/firestore'
import { createNotification } from '@/app/lib/notifications'

interface RouteParams {
  params: Promise<{ workspaceId: string }>
}

export async function GET(_req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const isMember = await checkIsWorkspaceMember({
      workspaceId,
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })

    if (!isMember) {
      return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const wsDoc = await db.collection('workspaces').doc(workspaceId).get()
    if (!wsDoc.exists) {
      return NextResponse.json({ message: 'Workspace não encontrado' }, { status: 404 })
    }

    const wsData = wsDoc.data()
    const ownerId: string = wsData?.ownerId || ''
    const memberIds: string[] = wsData?.members || []

    // Buscar dados dos usuários membros
    const allUserIds = Array.from(new Set([ownerId, ...memberIds])).filter(Boolean)
    const userDocs = allUserIds.length > 0
      ? await db.getAll(...allUserIds.map((userId) => db.collection('users').doc(userId)))
      : []
    const membersList = userDocs
      .filter((userDoc) => userDoc.exists)
      .map((userDoc) => {
        const uData = userDoc.data()
        return {
          id: userDoc.id,
          name: uData?.name || 'Usuário',
          email: uData?.email || '',
          image: uData?.image || null,
          role: userDoc.id === ownerId ? 'owner' : 'member',
          joinedAt: serializeFirestoreDate(uData?.createdAt),
        }
      })

    // Invitation details are administrative and owner-only.
    const invitesSnapshot = session.user.id === ownerId
      ? await db.collection('invitations')
          .where('workspaceId', '==', workspaceId)
          .where('status', '==', 'pending')
          .get()
      : null

    const pendingInvites = (invitesSnapshot?.docs || []).map((doc) => {
      const iData = doc.data()
      return {
        id: doc.id,
        inviteeEmail: iData.inviteeEmail,
        status: iData.status,
        createdAt: serializeFirestoreDate(iData.createdAt),
      }
    })

    return NextResponse.json({
      workspace: {
        id: wsDoc.id,
        name: wsData?.name,
        type: wsData?.type,
        ownerId,
      },
      members: membersList,
      pendingInvites,
      isOwner: session.user.id === ownerId,
    }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao listar membros do workspace:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao listar membros'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: RouteParams) {
  try {
    const { workspaceId } = await props.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const wsDoc = await db.collection('workspaces').doc(workspaceId).get()
    if (!wsDoc.exists) {
      return NextResponse.json({ message: 'Workspace não encontrado' }, { status: 404 })
    }

    const wsData = wsDoc.data()
    if (wsData?.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Apenas o proprietário da caixinha pode remover membros' }, { status: 403 })
    }

    const body = await req.json()
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json({ message: 'ID do membro é obrigatório' }, { status: 400 })
    }

    if (memberId === wsData.ownerId) {
      return NextResponse.json({ message: 'Não é possível remover o proprietário da caixinha' }, { status: 400 })
    }

    const workspaceRef = db.collection('workspaces').doc(workspaceId)
    const userRef = db.collection('users').doc(memberId)
    await db.runTransaction(async (transaction) => {
      const [freshWorkspace, userDoc] = await Promise.all([
        transaction.get(workspaceRef),
        transaction.get(userRef),
      ])
      if (!freshWorkspace.exists || freshWorkspace.data()?.ownerId !== session.user.id) {
        throw new Error('Autorização do proprietário mudou durante a operação')
      }
      if (memberId === freshWorkspace.data()?.ownerId) {
        throw new Error('Não é possível remover o proprietário da caixinha')
      }

      transaction.update(workspaceRef, {
        members: FieldValue.arrayRemove(memberId),
        updatedAt: new Date(),
      })
      if (userDoc.exists) {
        transaction.update(userRef, {
          workspaceIds: FieldValue.arrayRemove(workspaceId),
          updatedAt: new Date(),
        })
      }
    })
    await createNotification({ userId: memberId, type: 'workspace.member_removed', category: 'workspace', title: 'Acesso removido', body: `Seu acesso à caixinha "${wsData?.name || 'Caixinha'}" foi removido.`, workspaceId, actionUrl: '/', dedupeKey: `member-removed:${workspaceId}:${memberId}:${Date.now()}` })

    return NextResponse.json({ message: 'Membro removido com sucesso!' }, { status: 200 })
  } catch (error: unknown) {
    console.error('Erro ao remover membro do workspace:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao remover membro'
    return NextResponse.json({ message }, { status: 500 })
  }
}
