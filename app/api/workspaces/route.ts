import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { serializeFirestoreDate } from '@/app/lib/date-utils'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    if (!userId) {
      return NextResponse.json({ message: 'UID do usuário não encontrado na sessão' }, { status: 500 })
    }

    const workspaceMap = new Map<string, Record<string, unknown>>()
    const sessionWorkspaceIds = Array.isArray(session.user.workspaceIds)
      ? Array.from(new Set(session.user.workspaceIds.filter(Boolean)))
      : []

    if (sessionWorkspaceIds.length > 0) {
      // IDs vêm do JWT assinado e evitam duas consultas que podem retornar o mesmo workspace.
      const workspaceDocs = await db.getAll(
        ...sessionWorkspaceIds.map((workspaceId) => db.collection('workspaces').doc(workspaceId))
      )
      workspaceDocs.forEach((doc) => {
        if (doc.exists) {
          workspaceMap.set(doc.id, { id: doc.id, ...doc.data() })
        }
      })
    } else {
      // Fallback para sessões legadas sem workspaceIds.
      const [memberSnap, ownerSnap] = await Promise.all([
        db.collection('workspaces').where('members', 'array-contains', userId).get(),
        db.collection('workspaces').where('ownerId', '==', userId).get(),
      ])

      memberSnap.docs.forEach((doc) => {
        workspaceMap.set(doc.id, { id: doc.id, ...doc.data() })
      })

      ownerSnap.docs.forEach((doc) => {
        workspaceMap.set(doc.id, { id: doc.id, ...doc.data() })
      })
    }

    // Se o usuário ainda não tiver nenhuma caixinha, cria uma pessoal automaticamente (auto-healing)
    if (workspaceMap.size === 0) {
      const newWorkspaceRef = db.collection('workspaces').doc()
      const userRef = db.collection('users').doc(userId)
      const userDoc = await userRef.get()
      const userData = userDoc.exists ? userDoc.data() : null

      const newWorkspaceData = {
        name: `Caixinha de ${userData?.name || session.user.name || session.user.email?.split('@')[0] || 'Pessoal'}`,
        ownerId: userId,
        members: [userId],
        type: 'personal',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const batch = db.batch()
      batch.set(newWorkspaceRef, newWorkspaceData)

      if (userDoc.exists) {
        batch.update(userRef, {
          workspaceIds: [newWorkspaceRef.id],
          updatedAt: new Date(),
        })
      } else {
        batch.set(userRef, {
          name: session.user.name || 'Usuário',
          email: session.user.email || '',
          workspaceIds: [newWorkspaceRef.id],
          createdAt: Date.now(),
          isTrial: true,
          isSubscribed: false,
          updatedAt: new Date(),
        })
      }

      await batch.commit()
      console.log(`[Workspaces API] Caixinha pessoal auto-criada para ${userId}: ${newWorkspaceRef.id}`)

      workspaceMap.set(newWorkspaceRef.id, {
        id: newWorkspaceRef.id,
        ...newWorkspaceData,
      })
    }

    const workspaces = Array.from(workspaceMap.values()).map((ws) => ({
      ...ws,
      createdAt: serializeFirestoreDate(ws.createdAt),
      updatedAt: serializeFirestoreDate(ws.updatedAt),
    }))

    return NextResponse.json(workspaces, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar workspaces:', error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar workspaces' }, { status: 500 })
  }
}
