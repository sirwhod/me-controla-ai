import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
const createCreditSchema = z.object({
  description: z.string().min(1, { message: 'A descrição do crédito é obrigatória.' }),
  value: z.number().positive({ message: 'O valor do crédito deve ser positivo.' }),
  date: z.string().datetime({ message: 'Data da transação inválida.' }),
  bankId: z.string().optional().nullable(),
  paymentMethodId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  proofUrl: z.string().url('URL do comprovante inválida.').optional().or(z.literal('')).nullable(),
  status: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const creditsQuery = db.collection('workspaces').doc(workspaceId).collection('credits')
      .orderBy('date', 'desc')

    const querySnapshot = await creditsQuery.get()

    const credits = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : null,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      }
    })

    return NextResponse.json(credits, { status: 200 })

  } catch (error) {
    console.error(`Erro ao listar créditos para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar créditos' }, { status: 500 })
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
      paymentMethodId,
      categoryId,
      proofUrl,
      status,
    } = validationResult.data

    const dateObj = new Date(date)

    const month = dateObj.toLocaleString('pt-BR', { month: 'long' }) 
    const year = dateObj.getFullYear()

    const newCreditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc() // Firestore generates ID

    const newCreditData = {
      description: description.trim(),
      value: value,
      date: dateObj,
      month: month,
      year: year,
      bankId: bankId || null,
      paymentMethodId: paymentMethodId || null,
      categoryId: categoryId || null,
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
    console.error(`Erro ao criar crédito para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar crédito' }, { status: 500 })
  }
}
