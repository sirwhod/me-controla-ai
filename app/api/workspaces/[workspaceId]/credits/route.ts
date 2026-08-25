import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCreditSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { NextRequest, NextResponse } from 'next/server'

interface CreditsRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
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

    const creditsQuery = db.collection('workspaces').doc(workspaceId).collection('credits')
      .orderBy('date', 'desc')

    const querySnapshot = await creditsQuery.get()

    const credits = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: serializeFirestoreDate(data.date),
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
      }
    })

    return NextResponse.json(credits, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar créditos para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar créditos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
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
    const validationResult = createCreditSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar crédito.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const {
      description,
      value,
      date,
      bankId,
      paymentMethod,
      categoryId,
      proofUrl,
      status,
    } = validationResult.data

    const dateObj = new Date(date)

    const month = dateObj.toLocaleString('pt-BR', { month: 'long' }) 
    const year = dateObj.getFullYear()

    let bankName = ""
    let bankImageUrl = ""
    if (bankId) {
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
      const bankDoc = await bankRef.get()
      if (bankDoc.exists) {
        bankName = bankDoc.data()?.name || ""
        bankImageUrl = bankDoc.data()?.iconUrl || ""
      }
    }

    let categoryName = ""
    let categoryUrl = ""
    if (categoryId) {
      const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)
      const categoryDoc = await categoryRef.get()
      if (categoryDoc.exists) {
        categoryName = categoryDoc.data()?.name || ""
        categoryUrl = categoryDoc.data()?.icon || ""
      }
    }

    const newCreditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc()

    const newCreditData = {
      description: description.trim(),
      value: value,
      date: dateObj,
      month: month,
      year: year,
      bankId: bankId || null,
      bankName: bankName || null,
      bankImageUrl: bankImageUrl || null,
      paymentMethod: paymentMethod || null,
      categoryId: categoryId || null,
      categoryName: categoryName || null,
      categoryUrl: categoryUrl || null,
      proofUrl: proofUrl?.trim() || null,
      status: status || 'pending',
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newCreditRef.set(newCreditData)

    return NextResponse.json({ message: 'Crédito criado com sucesso!', creditId: newCreditRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar crédito para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar crédito' }, { status: 500 })
  }
}
