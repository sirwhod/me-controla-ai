import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createDebitSchema, Debit, TypeDebit } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { DocumentReference } from 'firebase-admin/firestore'
import { FieldPath } from 'firebase-admin/firestore'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestId, logFirestoreQuery, logHttpRequest } from '@/app/lib/observability'
import { applyMonthlyAnalyticsDelta } from '@/app/lib/firestore-analytics'
import { InvalidWorkspaceReferenceError, validateWorkspaceReferences } from '@/app/api/utils/validate-workspace-references'

interface DebitsRouteParams {
  workspaceId: string
}

export async function GET(req: NextRequest, { params }: { params: Promise<DebitsRouteParams> }) {
  const requestId = getRequestId(req)
  const startedAt = performance.now()
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

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const requestedLimit = Number(searchParams.get('limit'))
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 100) : null
    const cursor = searchParams.get('cursor')

    let debitsQuery: FirebaseFirestore.Query = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('debits')

    if (pageLimit || cursor) {
      debitsQuery = debitsQuery.orderBy('date', 'desc').orderBy(FieldPath.documentId(), 'desc')
      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { date: string; id: string }
          debitsQuery = debitsQuery.startAfter(new Date(decoded.date), decoded.id)
        } catch {
          return NextResponse.json({ message: 'Cursor inválido' }, { status: 400 })
        }
      }
      if (pageLimit) debitsQuery = debitsQuery.limit(pageLimit)
    }

    if (month && month !== 'todos') {
      debitsQuery = debitsQuery.where('month', '==', month.toLowerCase())
    }
    if (year && year !== 'todos') {
      debitsQuery = debitsQuery.where('year', '==', Number(year))
    }

    const querySnapshot = await debitsQuery.get()
    logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/debits', collection: 'debits', operation: 'query.get', documents: querySnapshot.size, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'debits.list' })

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
    }).sort((a, b) => {
      const left = a.date ? new Date(String(a.date)).getTime() : 0
      const right = b.date ? new Date(String(b.date)).getTime() : 0
      return right - left
    })

    const lastDoc = querySnapshot.docs.at(-1)
    const nextCursor = pageLimit && lastDoc && querySnapshot.size === pageLimit
      ? Buffer.from(JSON.stringify({ date: lastDoc.data().date.toDate?.()?.toISOString?.() || new Date(lastDoc.data().date).toISOString(), id: lastDoc.id })).toString('base64url')
      : null
    logHttpRequest({ requestId, endpoint: '/api/workspaces/:workspaceId/debits', method: 'GET', status: 200, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId })
    return NextResponse.json(debits, { status: 200, headers: { 'x-request-id': requestId, ...(nextCursor ? { 'x-next-cursor': nextCursor } : {}) } })
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

    const references = await validateWorkspaceReferences(workspaceId, [
      { collection: 'banks', id: bankId, field: 'bankId' },
      { collection: 'cards', id: creditCardId, field: 'creditCardId' },
      { collection: 'categories', id: categoryId, field: 'categoryId' },
      { collection: 'responsibles', id: responsibleId, field: 'responsibleId' },
    ])
    const bankDocData = references.get('bankId') || null
    const cardDocData = references.get('creditCardId') || null
    const categoryDocData = references.get('categoryId') || null
    const responsibleName = references.get('responsibleId')?.name || null

    if (cardDocData && bankId && cardDocData.bankId !== bankId) {
      return NextResponse.json({ message: 'O cartão não pertence ao banco selecionado' }, { status: 400 })
    }

    // Regra de Fechamento de Fatura de Cartão de Crédito
    const closingDayRaw = cardDocData?.closingDay ?? bankDocData?.invoiceClosingDay
    const getInvoiceDate = (baseDate: Date) => {
      if (paymentMethod === 'Crédito' && closingDayRaw !== undefined && closingDayRaw !== null) {
        const closingDay = typeof closingDayRaw === 'number' ? closingDayRaw : parseInt(String(closingDayRaw), 10)
        if (!isNaN(closingDay) && closingDay > 0 && baseDate.getDate() > closingDay) {
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
        await applyMonthlyAnalyticsDelta({ workspaceId, month, year, expenses: value, debitCount: 1 })
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
        const currInstallment = currentInstallment || 1

        newDebitData.isTemplate = false
        newDebitData.startDate = effStartDate
        newDebitData.totalInstallments = numInstallments

        // Cálculo com ajuste exato de centavos a partir do valor total digitado
        const totalCents = Math.round(value * 100)
        const baseInstallmentCents = Math.floor(totalCents / numInstallments)
        const remainderCents = totalCents % numInstallments

        const parcelasToCreate: Array<Debit & { ref: DocumentReference }> = []

        // A data base da 1ª parcela retrocede a partir da parcela atual
        const baseDay = effStartDate.getDate() || 1
        const firstInstallmentBaseDate = new Date(
          effStartDate.getFullYear(),
          effStartDate.getMonth() - (currInstallment - 1),
          baseDay
        )

        // Criar referências antecipadas para vincular originalDebitId
        const firstRef = db.collection('workspaces').doc(workspaceId).collection('debits').doc()

        for (let i = 1; i <= numInstallments; i++) {
          const ref = i === 1 ? firstRef : db.collection('workspaces').doc(workspaceId).collection('debits').doc()
          const installmentCents = i === 1 ? baseInstallmentCents + remainderCents : baseInstallmentCents
          const installmentValue = installmentCents / 100

          const installmentDate = new Date(
            firstInstallmentBaseDate.getFullYear(),
            firstInstallmentBaseDate.getMonth() + (i - 1),
            baseDay
          )
          const invoiceDate = getInvoiceDate(installmentDate)

          const parcelaData: Debit & { ref: DocumentReference } = {
            ...newDebitData,
            value: installmentValue,
            currentInstallment: i,
            date: installmentDate,
            month: invoiceDate.toLocaleString('pt-BR', { month: 'long' }),
            year: invoiceDate.getFullYear(),
            description: `Parcela ${i}/${numInstallments} - ${newDebitData.description}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            originalDebitId: firstRef.id,
            status: status || 'pending',
            ref,
          }
          parcelasToCreate.push(parcelaData)
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
          currentInstallment: currInstallment,
        }, { status: 201 })
      }

      default:
        return NextResponse.json({ message: 'Tipo de débito não reconhecido.' }, { status: 400 })
    }
  } catch (error: unknown) {
    if (error instanceof InvalidWorkspaceReferenceError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: 400 })
    }
    console.error('Erro ao criar débito:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor ao criar débito'
    return NextResponse.json({ message }, { status: 500 })
  }
}
