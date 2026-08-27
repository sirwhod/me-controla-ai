import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createDebitSchema, Debit, TypeDebit } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { DocumentReference } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'

interface DebitsRouteParams {
  workspaceId: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<DebitsRouteParams> }) {
  try {
    const { workspaceId } = await params
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

    const debitsQuery = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('debits')
      .orderBy('date', 'desc')

    const querySnapshot = await debitsQuery.get()

    const debits = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: serializeFirestoreDate(data.date),
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
        startDate: serializeFirestoreDate(data.startDate),
        endDate: serializeFirestoreDate(data.endDate),
      }
    })

    return NextResponse.json(debits, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar débitos:', error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar débitos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<DebitsRouteParams> }) {
  try {
    const { workspaceId } = await params
    const session = await auth()

    if (!session?.user?.id) {
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
    const validationResult = createDebitSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar débito.',
        error: validationResult.error.errors.map((e) => e.message).join(', '),
      }, { status: 400 })
    }

    const {
      description,
      value,
      date,
      type = 'Comum',
      bankId,
      creditCardId,
      paymentMethod,
      categoryId,
      responsibleId,
      proofUrl,
      status = 'pending',
      frequency,
      startDate,
      endDate,
      totalInstallments,
      currentInstallment = 1,
    } = validationResult.data

    const parseSafeDate = (val: unknown, fallback: Date = new Date()): Date => {
      if (!val) return fallback
      if (val instanceof Date) return isNaN(val.getTime()) ? fallback : val
      if (typeof val === 'string' && val.trim() !== '') {
        const d = new Date(val)
        return isNaN(d.getTime()) ? fallback : d
      }
      return fallback
    }

    const now = new Date()
    const startDateObj = parseSafeDate(startDate || date, now)
    const dateObj = parseSafeDate(date || startDate, now)
    const endDateObj = endDate && typeof endDate === 'string' && endDate.trim() !== '' ? parseSafeDate(endDate, now) : null

    let bankDocData: Record<string, unknown> | null = null
    if (bankId) {
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
      const bankDoc = await bankRef.get()
      if (bankDoc.exists) {
        bankDocData = bankDoc.data() || null
      }
    }

    let categoryDocData: Record<string, unknown> | null = null
    if (categoryId) {
      const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)
      const categoryDoc = await categoryRef.get()
      if (categoryDoc.exists) {
        categoryDocData = categoryDoc.data() || null
      }
    }

    let responsibleName: string | null = null
    if (responsibleId) {
      const responsibleDoc = await db.collection('workspaces').doc(workspaceId).collection('responsibles').doc(responsibleId).get()
      if (responsibleDoc.exists) {
        responsibleName = responsibleDoc.data()?.name || null
      }
    }

    // Regra de Fechamento de Fatura de Cartão de Crédito
    const bankClosingDay = typeof bankDocData?.invoiceClosingDay === 'string' ? bankDocData.invoiceClosingDay : null
    const getInvoiceDate = (baseDate: Date) => {
      if (paymentMethod === 'Crédito' && bankClosingDay) {
        const closingDay = parseInt(bankClosingDay, 10)
        if (!isNaN(closingDay) && baseDate.getDate() > closingDay) {
          // Compra após o fechamento: entra na fatura do mês subsequente
          return new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1)
        }
      }
      return baseDate
    }

    const invoiceDate = getInvoiceDate(dateObj)
    const month = invoiceDate.toLocaleString('pt-BR', { month: 'long' })
    const year = invoiceDate.getFullYear()

    const newDebitData: Debit = {
      description: description.trim(),
      value,
      date: dateObj,
      month,
      year,
      type: (type || 'Comum') as TypeDebit,
      bankId: bankId || null,
      bankName: typeof bankDocData?.name === 'string' ? bankDocData.name : null,
      bankImageUrl: typeof bankDocData?.iconUrl === 'string' ? bankDocData.iconUrl : null,
      creditCardId: creditCardId || null,
      categoryName: typeof categoryDocData?.name === 'string' ? categoryDocData.name : null,
      categoryUrl: typeof categoryDocData?.icon === 'string' ? categoryDocData.icon : null,
      paymentMethod: paymentMethod || 'Pix',
      categoryId: categoryId || null,
      responsibleId: responsibleId || null,
      responsibleName: responsibleName || null,
      proofUrl: proofUrl?.trim() || null,
      workspaceId,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
      status: status || 'pending',
    }

    const effectiveFrequency = frequency || 'monthly'

    switch (type) {
      case 'Comum': {
        const newDebitRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
        await newDebitRef.set(newDebitData)
        return NextResponse.json({
          message: 'Débito criado com sucesso!',
          debitId: newDebitRef.id,
        }, { status: 201 })
      }

      case 'Fixo': {
        const effStartDate = startDateObj
        newDebitData.isTemplate = true
        newDebitData.frequency = effectiveFrequency
        newDebitData.startDate = effStartDate
        newDebitData.endDate = endDateObj

        const debitsToCreate = []
        const baseStartDate = getInvoiceDate(effStartDate)
        const currentYear = baseStartDate.getFullYear()
        const current = new Date(baseStartDate.getFullYear(), baseStartDate.getMonth(), 1)
        while (current.getFullYear() === currentYear && current <= new Date(currentYear, 11, 31)) {
          const debitForMonth = {
            ...newDebitData,
            date: new Date(current),
            month: current.toLocaleString('pt-BR', { month: 'long' }),
            year: current.getFullYear(),
            createdAt: now,
            updatedAt: now,
          }
          debitsToCreate.push(debitForMonth)
          current.setMonth(current.getMonth() + 1)
        }

        const batch = db.batch()
        debitsToCreate.forEach((debit) => {
          const ref = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          batch.set(ref, debit)
        })
        await batch.commit()

        return NextResponse.json({ message: 'Débitos fixos criados com sucesso!', count: debitsToCreate.length }, { status: 201 })
      }

      case 'Assinatura': {
        const effStartDate = startDateObj
        newDebitData.isTemplate = true
        newDebitData.frequency = effectiveFrequency
        newDebitData.startDate = effStartDate
        newDebitData.endDate = endDateObj
        newDebitData.isActive = true

        const assinaturaDebitsToCreate = []
        const baseAssinaturaDate = getInvoiceDate(effStartDate)
        const baseDay = baseAssinaturaDate.getDate() || 1
        const startYear = baseAssinaturaDate.getFullYear()
        const startMonth = baseAssinaturaDate.getMonth()

        for (let i = 0; i < 12; i++) {
          const installmentDate = new Date(startYear, startMonth + i, baseDay)
          const debitForMonth = {
            ...newDebitData,
            date: installmentDate,
            month: installmentDate.toLocaleString('pt-BR', { month: 'long' }),
            year: installmentDate.getFullYear(),
            createdAt: now,
            updatedAt: now,
          }
          assinaturaDebitsToCreate.push(debitForMonth)
        }

        const assinaturaBatch = db.batch()
        assinaturaDebitsToCreate.forEach((debit) => {
          const ref = db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          assinaturaBatch.set(ref, debit)
        })
        await assinaturaBatch.commit()

        return NextResponse.json({ message: 'Assinatura criada com sucesso!', count: assinaturaDebitsToCreate.length }, { status: 201 })
      }

      case 'Parcelamento': {
        const effStartDate = startDateObj || dateObj || new Date()
        const numInstallments = totalInstallments || 2

        newDebitData.isTemplate = false
        newDebitData.startDate = effStartDate
        newDebitData.totalInstallments = numInstallments

        const parcelasToCreate: Array<Debit & { ref: DocumentReference }> = []
        const baseParcelaDate = getInvoiceDate(effStartDate)
        const parcelaDate = new Date(baseParcelaDate.getFullYear(), baseParcelaDate.getMonth(), 1)

        // Criar referências antecipadas para vincular originalDebitId
        const firstRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()

        for (let i = 1; i <= numInstallments; i++) {
          const ref = i === 1 ? firstRef : db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          const installmentStatus = i <= currentInstallment ? 'paid' : 'pending'

          const parcelaData: Debit & { ref: DocumentReference } = {
            ...newDebitData,
            currentInstallment: i,
            date: new Date(parcelaDate),
            month: parcelaDate.toLocaleString('pt-BR', { month: 'long' }),
            year: parcelaDate.getFullYear(),
            description: `Parcela ${i}/${numInstallments} - ${newDebitData.description}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            originalDebitId: firstRef.id,
            status: installmentStatus,
            ref,
          }
          parcelasToCreate.push(parcelaData)
          parcelaDate.setMonth(parcelaDate.getMonth() + 1)
        }

        const parcelaBatch = db.batch()
        parcelasToCreate.forEach(({ ref, ...debitData }) => {
          parcelaBatch.set(ref, debitData)
        })
        await parcelaBatch.commit()

        return NextResponse.json({
          message: 'Parcelamento criado com sucesso!',
          originalDebitId: firstRef.id,
          totalInstallments: numInstallments,
          currentInstallment,
        }, { status: 201 })
      }

      default:
        return NextResponse.json({ message: 'Tipo de débito não reconhecido.' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Erro ao criar débito:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor ao criar débito'
    return NextResponse.json({ message }, { status: 500 })
  }
}
