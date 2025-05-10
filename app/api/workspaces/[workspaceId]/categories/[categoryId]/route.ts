import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updateCategorySchema } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

interface CategoryRouteParams {
  workspaceId: string
  categoryId: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const categoryId = searchParams.categoryId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)
    const categoryDoc = await categoryRef.get()

    if (!categoryDoc.exists) {
      return NextResponse.json({ message: 'Categoria não encontrada' }, { status: 404 })
    }

    const categoryData = categoryDoc.data()
    const formattedCategory = {
      id: categoryDoc.id,
      ...categoryData,
      createdAt: categoryData?.createdAt ? categoryData.createdAt.toDate() : null,
      updatedAt: categoryData?.updatedAt ? categoryData.updatedAt.toDate() : null,
    }

    return NextResponse.json(formattedCategory, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao visualizar categoria ${searchParams.categoryId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar categoria' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const categoryId = searchParams.categoryId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updateCategorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar categoria.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)

    await categoryRef.update({
        ...updateData,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Categoria atualizada com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao atualizar categoria ${searchParams.categoryId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar categoria' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const categoryId = searchParams.categoryId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)

    const categoryDoc = await categoryRef.get()
    if (!categoryDoc.exists) {
        return NextResponse.json({ message: 'Categoria não encontrada para exclusão' }, { status: 404 })
    }

    await categoryRef.delete()

    return NextResponse.json({ message: 'Categoria excluída com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao excluir categoria ${searchParams.categoryId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir categoria' }, { status: 500 })
  }
}
