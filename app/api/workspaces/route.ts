import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const userId = session.user.id

    if (!userId) {
        return NextResponse.json({ message: 'UID do usuário não encontrado na sessão' }, { status: 500 })
    }

    const workspacesQuery = db.collection('workspaces').where('members', 'array-contains', userId)

    const querySnapshot = await workspacesQuery.get()

    const workspaces = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      }
    })
    
    return NextResponse.json(workspaces, { status: 200 })

  } catch (error) {
    console.error('Erro ao listar workspaces:', error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar workspaces' }, { status: 500 })
  }
}