import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/firebase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPaymentMethodSchema = z.object({
  name: z.string().min(1, { message: 'O nome do método de pagamento é obrigatório.' }),
  type: z.enum(['Crédito', 'Débito', 'Pix', 'Conta'], {
    errorMap: () => ({ message: 'Tipo de método de pagamento inválido.' }),
  }),
  bankId: z.string().optional().nullable(),
  invoiceClosingDay: z.number().int().min(1).max(31).optional().nullable(),
  invoiceDueDate: z.number().int().min(1).max(31).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const paymentMethodsQuery = db.collection('workspaces').doc(workspaceId).collection('paymentMethods')
      .orderBy('name', 'asc');

    const querySnapshot = await paymentMethodsQuery.get();

    const paymentMethods = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    });

    return NextResponse.json(paymentMethods, { status: 200 });

  } catch (error) {
    console.error(`Erro ao listar metodos de pagamento para workspace ${params.workspaceId}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor ao listar metodos de pagamento' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = createPaymentMethodSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar metodo de pagamento.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }

    const { name, type, bankId, invoiceClosingDay, invoiceDueDate } = validationResult.data;

    if (type === 'Crédito') {
        if (invoiceClosingDay === undefined || invoiceClosingDay === null) {
             return NextResponse.json({ message: 'Dia de fechamento da fatura é obrigatório para tipo Crédito.' }, { status: 400 });
        }
         if (invoiceDueDate === undefined || invoiceDueDate === null) {
             return NextResponse.json({ message: 'Dia de vencimento da fatura é obrigatório para tipo Crédito.' }, { status: 400 });
        }
    } else {

        if (invoiceClosingDay !== undefined && invoiceClosingDay !== null) {
             return NextResponse.json({ message: 'Dia de fechamento da fatura só é permitido para tipo Crédito.' }, { status: 400 });
        }
         if (invoiceDueDate !== undefined && invoiceDueDate !== null) {
             return NextResponse.json({ message: 'Dia de vencimento da fatura só é permitido para tipo Crédito.' }, { status: 400 });
        }
    }

    const newPaymentMethodRef = db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc();

    const newPaymentMethodData = {
      name: name.trim(),
      type: type,
      bankId: bankId || null,
      invoiceClosingDay: type === 'Crédito' ? invoiceClosingDay : null,
      invoiceDueDate: type === 'Crédito' ? invoiceDueDate : null,
      workspaceId: workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newPaymentMethodRef.set(newPaymentMethodData);

    return NextResponse.json({ message: 'Método de pagamento criado com sucesso!', paymentMethodId: newPaymentMethodRef.id }, { status: 201 });

  } catch (error) {
    console.error(`Erro ao criar metodo de pagamento para workspace ${params.workspaceId}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor ao criar metodo de pagamento' }, { status: 500 });
  }
}
