import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createPaymentMethodSchema } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

interface PaymentMethodsRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const paymentMethodsQuery = db.collection('workspaces').doc(workspaceId).collection('paymentMethods')
      .orderBy('name', 'asc')

    const querySnapshot = await paymentMethodsQuery.get()

    const paymentMethods = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      }
    })

    return NextResponse.json(paymentMethods, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar metodos de pagamento para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar metodos de pagamento' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<PaymentMethodsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validationResult = createPaymentMethodSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar metodo de pagamento.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, type, bankId, invoiceClosingDay, invoiceDueDate } = validationResult.data

    if (type === 'Crédito') {
        if (invoiceClosingDay === undefined || invoiceClosingDay === null) {
             return NextResponse.json({ message: 'Dia de fechamento da fatura é obrigatório para tipo Crédito.' }, { status: 400 })
        }
         if (invoiceDueDate === undefined || invoiceDueDate === null) {
             return NextResponse.json({ message: 'Dia de vencimento da fatura é obrigatório para tipo Crédito.' }, { status: 400 })
        }
    } else {

        if (invoiceClosingDay !== undefined && invoiceClosingDay !== null) {
             return NextResponse.json({ message: 'Dia de fechamento da fatura só é permitido para tipo Crédito.' }, { status: 400 })
        }
         if (invoiceDueDate !== undefined && invoiceDueDate !== null) {
             return NextResponse.json({ message: 'Dia de vencimento da fatura só é permitido para tipo Crédito.' }, { status: 400 })
        }
    }

    const newPaymentMethodRef = db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc()

    const newPaymentMethodData = {
      name: name.trim(),
      type: type,
      bankId: bankId || null,
      invoiceClosingDay: type === 'Crédito' ? invoiceClosingDay : null,
      invoiceDueDate: type === 'Crédito' ? invoiceDueDate : null,
      workspaceId: workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newPaymentMethodRef.set(newPaymentMethodData)

    return NextResponse.json({ message: 'Método de pagamento criado com sucesso!', paymentMethodId: newPaymentMethodRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar metodo de pagamento para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar metodo de pagamento' }, { status: 500 })
  }
}
