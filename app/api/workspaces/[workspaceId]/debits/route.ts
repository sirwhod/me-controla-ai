import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createDebitSchema, Debit } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const workspaceId = params.workspaceId
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }
    
    const debitsQuery = db.collection('workspaces').doc(workspaceId).collection('debits')
      .orderBy('date', 'desc')

    const querySnapshot = await debitsQuery.get()

    const debits = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: data.date ? data.date.toDate() : null,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        startDate: data.startDate ? data.startDate.toDate() : null,
        endDate: data.endDate ? data.endDate.toDate() : null,
      }
    })

    return NextResponse.json(debits, { status: 200 })

  } catch (error) {
    console.error(`Erro ao listar débitos para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar débitos' }, { status: 500 })
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
    const validationResult = createDebitSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar débito.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const {
      description,
      value,
      date,
      type,
      bankId,
      paymentMethodId,
      categoryId,
      proofUrl,
      frequency,
      startDate,
      endDate,
      totalInstallments,
      currentInstallment,
    } = validationResult.data

    const dateObj = new Date(date)
    const startDateObj = startDate ? new Date(startDate) : null
    const endDateObj = endDate ? new Date(endDate) : null

    const month = dateObj.toLocaleString('pt-BR', { month: 'long' })
    const year = dateObj.getFullYear()

    const newDebitData: Debit = {
      description: description.trim(),
      value: value,
      date: dateObj,
      month: month,
      year: year,
      type: type,
      bankId: bankId || null,
      paymentMethodId: paymentMethodId || null,
      categoryId: categoryId || null,
      proofUrl: proofUrl?.trim() || null,
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    }

    // Specific logic for each type
    switch (type) {
      case 'Comum':
        if (paymentMethodId && dateObj) {
          const paymentMethodDoc = await db.collection('workspaces').doc(workspaceId).collection('paymentMethods').doc(paymentMethodId).get()
          const paymentMethodData = paymentMethodDoc.data()
          if (paymentMethodData?.type === 'Crédito' && paymentMethodData?.invoiceClosingDay) {
            const closingDay = paymentMethodData.invoiceClosingDay
            const transactionDay = dateObj.getDate()
            if (transactionDay > closingDay) {
              
              const nextMonthDate = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 1)
              newDebitData.month = nextMonthDate.toLocaleString('pt-BR', { month: 'long' })
              newDebitData.year = nextMonthDate.getFullYear()
            }
          }
        }
        break

      case 'Fixo':
        if (!frequency || !startDate) {
            return NextResponse.json({ message: 'Frequência e Data de Início são obrigatórios para débito Fixo.' }, { status: 400 })
        }
        newDebitData.isTemplate = true
        newDebitData.frequency = frequency
        newDebitData.startDate = startDateObj
        newDebitData.endDate = endDateObj
        break

      case 'Assinatura':
        if (!frequency || !startDate) {
            return NextResponse.json({ message: 'Frequência e Data de Início são obrigatórios para débito Assinatura.' }, { status: 400 })
        }
        newDebitData.isTemplate = true
        newDebitData.frequency = frequency
        newDebitData.startDate = startDateObj
        newDebitData.endDate = endDateObj
        newDebitData.isActive = true
        break

      case 'Parcelamento':
        if (!startDate || !totalInstallments || !currentInstallment) {
             return NextResponse.json({ message: 'Data de Início, Total de Parcelas e Parcela Atual são obrigatórios para débito Parcelamento.' }, { status: 400 })
        }
        if (currentInstallment !== 1) {
             return NextResponse.json({ message: 'Ao criar um parcelamento, a parcela atual deve ser 1.' }, { status: 400 })
        }
        newDebitData.isTemplate = false
        newDebitData.startDate = startDateObj
        newDebitData.totalInstallments = totalInstallments
        newDebitData.currentInstallment = currentInstallment
        break
    }

    const newDebitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc() // Firestore generates ID


    await newDebitRef.set(newDebitData)

    if (type === 'Parcelamento' && newDebitData.currentInstallment === 1) {
        await newDebitRef.update({ originalDebitId: newDebitRef.id })
    }

    return NextResponse.json({ message: 'Débito criado com sucesso!', debitId: newDebitRef.id }, { status: 201 })

  } catch (error) {
    console.error(`Erro ao criar débito para workspace ${params.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar débito' }, { status: 500 })
  }
}
