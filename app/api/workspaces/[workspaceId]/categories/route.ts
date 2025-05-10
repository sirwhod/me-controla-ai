import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCategorySchema } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
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
    console.error(`Erro ao listar categorias para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar categorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = createCategorySchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar categoria.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, type } = validationResult.data

    const newCategoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc()

    const newCategoryData = {
      name: name.trim(),
      type: type,
      workspaceId: workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newCategoryRef.set(newCategoryData)

    return NextResponse.json({ message: 'Categoria criada com sucesso!', categoryId: newCategoryRef.id }, { status: 201 })

  } catch (error) {
    console.error(`Erro ao criar categoria para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar categoria' }, { status: 500 })
  }
}
