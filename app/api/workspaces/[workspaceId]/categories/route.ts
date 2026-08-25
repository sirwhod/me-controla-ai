import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCategorySchema } from '@/app/types/financial';
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
      workspaceIds: session.user.workspaceIds
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
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
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
      workspaceIds: session.user.workspaceIds
    })
    
    if (!isMember) {
       return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const formData = await req.formData()

    const rawName = formData.get('name')
    const rawType = formData.get('type')
    const rawIcon = formData.get('icon')

    const categoryDataFromForm = {
      name: typeof rawName === 'string' ? rawName : '',
      type: typeof rawType === 'string' ? rawType : '',
      icon: typeof rawIcon === 'string' ? (rawIcon as IconName) : undefined,
    }

    const validationResult = createCategorySchema.safeParse(categoryDataFromForm)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar categoria.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, type, icon } = validationResult.data

    const newCategoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc()

    const newCategoryData = {
      name: name.trim(),
      type: type,
      icon: icon,
      workspaceId: workspaceId,
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
