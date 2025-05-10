import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1, { message: 'O nome do método de pagamento não pode ser vazio.' }).optional(),
  type: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Tipo de método de pagamento inválido.' }),
  }).optional(),
  bankId: z.string().optional().nullable(),
  invoiceClosingDay: z.number().int().min(1).max(31).optional().nullable(),
  invoiceDueDate: z.number().int().min(1).max(31).optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string; paymentMethodId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const paymentMethodId = params.paymentMethodId
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
    console.error(`Erro ao visualizar metodo de pagamento ${params.paymentMethodId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao visualizar metodo de pagamento' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { workspaceId: string; paymentMethodId: string } }) {
    return PATCH(req, { params })
}

export async function PATCH(req: NextRequest, { params }: { params: { workspaceId: string; paymentMethodId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const paymentMethodId = params.paymentMethodId
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
    console.error(`Erro ao atualizar metodo de pagamento ${params.paymentMethodId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao atualizar metodo de pagamento' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { workspaceId: string; paymentMethodId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const paymentMethodId = params.paymentMethodId
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
    console.error(`Erro ao excluir metodo de pagamento ${params.paymentMethodId} para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao excluir metodo de pagamento' }, { status: 500 })
  }
}
