import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCategorySchema } from '@/app/types/financial';
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { IconName } from 'lucide-react/dynamic';
import { NextRequest, NextResponse } from 'next/server'

interface CategoryRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    const session = await auth()

    if (!session?.user) {
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

    const categoriesQuery = db.collection('workspaces').doc(workspaceId).collection('categories')
      .orderBy('name', 'asc')

    const querySnapshot = await categoriesQuery.get()

    const categories = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
      }
    })

    return NextResponse.json(categories, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar categorias para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar categorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    const session = await auth()

    if (!session?.user) {
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

    const body = await req.json()
    const validationResult = createCategorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar categoria.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, icon, type } = validationResult.data

    const newCategoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc()

    const newCategoryData = {
      name: name.trim(),
      icon: (icon as IconName) || null,
      type: type || 'expense',
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newCategoryRef.set(newCategoryData)

    return NextResponse.json({ message: 'Categoria criada com sucesso!', categoryId: newCategoryRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar categoria para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar categoria' }, { status: 500 })
  }
}
