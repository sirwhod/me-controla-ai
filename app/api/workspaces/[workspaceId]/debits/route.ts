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

    let newDebitRef: any = null;

    // Specific logic for each type
    switch (type) {
      case 'Comum':
        newDebitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
        await newDebitRef.set(newDebitData)

        break

      case 'Fixo':
        if (!frequency || !startDate) {
          return NextResponse.json({ message: 'Frequência e Data de Início são obrigatórios para débito Fixo.' }, { status: 400 })
        }
        newDebitData.isTemplate = true
        newDebitData.frequency = frequency
        newDebitData.startDate = startDateObj
        newDebitData.endDate = endDateObj

        // Criação de débitos mensais até o fim do ano atual
        const debitsToCreate = []
        const now = new Date()
        const year = now.getFullYear()
        let current = new Date(startDateObj!)

        // Garante que começa no mês do startDate
        current.setDate(1)
        while (current.getFullYear() === year && current <= new Date(year, 11, 31)) {
          // Cria uma cópia dos dados para cada mês
          const debitForMonth = {
            ...newDebitData,
            date: new Date(current),
            month: current.toLocaleString('pt-BR', { month: 'long' }),
            year: current.getFullYear(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          debitsToCreate.push(debitForMonth)
          // Próximo mês
          current.setMonth(current.getMonth() + 1)
        }

        // Salva todos os débitos no Firestore
        const batch = db.batch()
        debitsToCreate.forEach(debit => {
          const ref = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          batch.set(ref, debit)
        })
        await batch.commit()

        return NextResponse.json({ message: 'Débitos fixos criados com sucesso!', count: debitsToCreate.length }, { status: 201 })

      case 'Assinatura':
        if (!frequency || !startDate) {
          return NextResponse.json({ message: 'Frequência e Data de Início são obrigatórios para débito Assinatura.' }, { status: 400 })
        }
        newDebitData.isTemplate = true
        newDebitData.frequency = frequency
        newDebitData.startDate = startDateObj
        newDebitData.endDate = endDateObj
        newDebitData.isActive = true

        // Criação de débitos mensais para 12 meses a partir do startDate
        const assinaturaDebitsToCreate = []
        let assinaturaCurrent = new Date(startDateObj!)
        assinaturaCurrent.setDate(1)
        for (let i = 0; i < 12; i++) {
          const debitForMonth = {
            ...newDebitData,
            date: new Date(assinaturaCurrent),
            month: assinaturaCurrent.toLocaleString('pt-BR', { month: 'long' }),
            year: assinaturaCurrent.getFullYear(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          assinaturaDebitsToCreate.push(debitForMonth)
          assinaturaCurrent.setMonth(assinaturaCurrent.getMonth() + 1)
        }

        // Salva todos os débitos no Firestore
        const assinaturaBatch = db.batch()
        assinaturaDebitsToCreate.forEach(debit => {
          const ref = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          assinaturaBatch.set(ref, debit)
        })
        await assinaturaBatch.commit()

        return NextResponse.json({ message: 'Débitos de assinatura criados com sucesso!', count: assinaturaDebitsToCreate.length }, { status: 201 })

      case 'Parcelamento':
        console.log({ totalInstallments, currentInstallment, startDate })
        if (!startDate || !totalInstallments || !currentInstallment) {
          return NextResponse.json({ message: 'Data de Início, Total de Parcelas e Parcela Atual são obrigatórios para débito Parcelamento.' }, { status: 400 })
        }
        if (currentInstallment !== 1) {
          return NextResponse.json({ message: 'Ao criar um parcelamento, a parcela atual deve ser 1.' }, { status: 400 })
        }
        newDebitData.isTemplate = false
        newDebitData.startDate = startDateObj
        newDebitData.totalInstallments = totalInstallments

        // Criação das parcelas
        const parcelasToCreate = []
        let parcelaDate = new Date(startDateObj!)
        parcelaDate.setDate(1)
        for (let i = 1; i <= totalInstallments; i++) {
          const parcelaData = {
            ...newDebitData,
            currentInstallment: i,
            date: new Date(parcelaDate),
            month: parcelaDate.toLocaleString('pt-BR', { month: 'long' }),
            year: parcelaDate.getFullYear(),
            description: `Parcela ${i}/${totalInstallments} - ${newDebitData.description}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            originalDebitId: '', // será preenchido depois
          }
          parcelasToCreate.push(parcelaData)
          parcelaDate.setMonth(parcelaDate.getMonth() + 1)
        }

        // Salva todas as parcelas no Firestore
        const parcelamentoBatch = db.batch()
        const firstRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
        parcelasToCreate.forEach((parcela, idx) => {
          // Usa o mesmo id para a primeira parcela, os outros são novos
          const ref = idx === 0 ? firstRef : db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          parcela.originalDebitId = firstRef.id
          parcelamentoBatch.set(ref, parcela)
        })
        await parcelamentoBatch.commit()

        return NextResponse.json({ message: 'Parcelamento criado com sucesso!', count: parcelasToCreate.length, originalDebitId: firstRef.id }, { status: 201 })
    }

    return NextResponse.json({ message: 'Débito criado com sucesso!', debitId: newDebitRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar débito para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar débito' }, { status: 500 })
  }
}
