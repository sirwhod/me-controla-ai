import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createDebitSchema, Debit, TypeDebit } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

interface DebitsRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<DebitsRouteParams> }) {
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
    const searchParams = await params
    console.error(`Erro ao listar débitos para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar débitos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<DebitsRouteParams> }) {
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
      paymentMethod,
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

    if (!bankId) {
      return NextResponse.json({ message: 'Banco não encontrado' }, { status: 404 })
    }

    const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
    const bankDoc = await bankRef.get()

    if (!bankDoc.exists) {
      return NextResponse.json({ message: 'Banco não encontrado' }, { status: 404 })
    }

    if (!categoryId) {
      return NextResponse.json({ message: 'Categoria não encontrada' }, { status: 404 })
    }

    const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)
    const categoryDoc = await categoryRef.get()

    if (!categoryDoc.exists) {
      return NextResponse.json({ message: 'Categoria não encontrada' }, { status: 404 })
    }

    const newDebitData: Debit = {
      description: description.trim(),
      value: value,
      date: dateObj,
      month: month,
      year: year,
      type: type as TypeDebit,
      bankId: bankId || null,
      bankName: bankDoc.data()?.name || "",
      bankImageUrl: bankDoc.data()?.iconUrl || "",
      categoryName: categoryDoc.data()?.name || "",
      categoryUrl: categoryDoc.data()?.icon || "",
      paymentMethod: paymentMethod || null,
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
    const searchParams = await params
    console.error(`Erro ao criar débito para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar débito' }, { status: 500 })
  }
}
