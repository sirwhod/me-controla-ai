import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { updatePaymentMethodSchema } from '@/app/types/financial';
import { NextRequest, NextResponse } from 'next/server'

interface PaymentMethodsRouteParams {
  workspaceId: string;
  paymentMethodId: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const paymentMethodId = searchParams.paymentMethodId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const paymentMethodRef = db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc(paymentMethodId)
    const paymentMethodDoc = await paymentMethodRef.get()

    if (!paymentMethodDoc.exists) {
      return NextResponse.json({ message: 'Método de pagamento não encontrado' }, { status: 404 })
    }

    const paymentMethodData = paymentMethodDoc.data()
    const formattedPaymentMethod = {
      id: paymentMethodDoc.id,
      ...paymentMethodData,
      createdAt: paymentMethodData?.createdAt ? paymentMethodData.createdAt.toDate() : null,
      updatedAt: paymentMethodData?.updatedAt ? paymentMethodData.updatedAt.toDate() : null,
    }

    return NextResponse.json(formattedPaymentMethod, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao visualizar metodo de pagamento ${searchParams.paymentMethodId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar metodo de pagamento' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const paymentMethodId = searchParams.paymentMethodId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = updatePaymentMethodSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para atualizar metodo de pagamento.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const updateData = validationResult.data

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: 'Nenhum dado fornecido para atualização' }, { status: 400 })
    }

    const paymentMethodRef = db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc(paymentMethodId)

    await paymentMethodRef.update({
        ...updateData,
        updatedAt: new Date(),
    })

    return NextResponse.json({ message: 'Método de pagamento atualizado com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao atualizar metodo de pagamento ${searchParams.paymentMethodId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar metodo de pagamento' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const paymentMethodId = searchParams.paymentMethodId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const paymentMethodRef = db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc(paymentMethodId)

    const paymentMethodDoc = await paymentMethodRef.get()
    if (!paymentMethodDoc.exists) {
        return NextResponse.json({ message: 'Método de pagamento não encontrado para exclusão' }, { status: 404 })
    }

    await paymentMethodRef.delete()

    return NextResponse.json({ message: 'Método de pagamento excluído com sucesso!' }, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao excluir metodo de pagamento ${searchParams.paymentMethodId} para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir metodo de pagamento' }, { status: 500 })
  }
}
