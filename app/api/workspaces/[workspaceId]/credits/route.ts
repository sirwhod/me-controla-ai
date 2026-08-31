import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCreditSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestId, logFirestoreQuery, logHttpRequest } from '@/app/lib/observability'
import { calculateEntryDeltas, writeFinancialPeriodDeltas } from '@/app/lib/financial-periods'
import { InvalidWorkspaceReferenceError, validateWorkspaceReferences } from '@/app/api/utils/validate-workspace-references'
import { getIdempotencyKey, runIdempotentFinancialWrite } from '@/app/lib/idempotent-financial-write'
import { FinancialIndexNotReadyError, getFinancialListPage } from '@/app/lib/financial-list-query'

interface CreditsRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  const requestId = getRequestId(req)
  const startedAt = performance.now()
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
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

    const { searchParams: requestSearchParams } = new URL(req.url)
    const month = requestSearchParams.get('month')
    const year = requestSearchParams.get('year')
    const requestedLimit = Number(requestSearchParams.get('limit'))
    const pageLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(Math.floor(requestedLimit), 100) : 50
    const cursor = requestSearchParams.get('cursor')
    const creditsCollection = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('credits')
    let page
    try {
      page = await getFinancialListPage({ collection: creditsCollection, month, year, pageLimit, cursor })
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CURSOR') {
        return NextResponse.json({ message: 'Cursor inválido' }, { status: 400 })
      }
      throw error
    }
    logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/credits', collection: 'credits', operation: page.fallback ? 'fallback.get' : 'query.get', documents: page.documentsRead, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: page.fallback ? 'credits.list.index-fallback' : 'credits.list' })

    const credits = page.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        date: serializeFirestoreDate(data.date),
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
      }
    }).sort((a, b) => {
      const left = a.date ? new Date(String(a.date)).getTime() : 0
      const right = b.date ? new Date(String(b.date)).getTime() : 0
      return right - left
    })

    logHttpRequest({ requestId, endpoint: '/api/workspaces/:workspaceId/credits', method: 'GET', status: 200, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId })
    return NextResponse.json(credits, { status: 200, headers: { 'x-request-id': requestId, ...(page.nextCursor ? { 'x-next-cursor': page.nextCursor } : {}), ...(page.fallback ? { 'x-query-fallback': 'firestore-index' } : {}) } })

  } catch (error) {
    if (error instanceof InvalidWorkspaceReferenceError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: 400 })
    }
    const searchParams = await params
    console.error(`Erro ao listar créditos para workspace ${searchParams.workspaceId}:`, error)
    if (error instanceof FinancialIndexNotReadyError) {
      return NextResponse.json({ code: error.code, message: error.message, retryable: error.retryable }, { status: 503, headers: { 'retry-after': '15', 'x-request-id': requestId } })
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao listar créditos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<CreditsRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId
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
      type,
      startDate,
      endDate,
      frequency,
      bankId,
      paymentMethod,
      categoryId,
      responsibleId,
      status,
    } = validationResult.data

    const effectiveType = type || 'Comum'
    const dateObj = new Date(date || startDate || new Date().toISOString())
    const startDateObj = startDate ? new Date(startDate) : dateObj
    const endDateObj = endDate ? new Date(endDate) : null
    const month = dateObj.toLocaleString('pt-BR', { month: 'long' }) 
    const year = dateObj.getFullYear()
    const now = new Date()

    const references = await validateWorkspaceReferences(workspaceId, [
      { collection: 'banks', id: bankId, field: 'bankId' },
      { collection: 'categories', id: categoryId, field: 'categoryId' },
      { collection: 'responsibles', id: responsibleId, field: 'responsibleId' },
    ])
    const bankName = references.get('bankId')?.name || ''
    const bankImageUrl = references.get('bankId')?.iconUrl || ''
    const categoryName = references.get('categoryId')?.name || ''
    const categoryUrl = references.get('categoryId')?.icon || ''
    const responsibleName = references.get('responsibleId')?.name || ''

    const baseCreditData = {
      description: description.trim(),
      value: value,
      date: dateObj,
      month: month,
      year: year,
      type: effectiveType,
      bankId: bankId || null,
      bankName: bankName || null,
      bankImageUrl: bankImageUrl || null,
      paymentMethod: paymentMethod || 'Pix',
      categoryId: categoryId || null,
      categoryName: categoryName || null,
      categoryUrl: categoryUrl || null,
      responsibleId: responsibleId || null,
      responsibleName: responsibleName || null,
      proofUrl: null,
      status: status || 'received',
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    }
    const idempotencyKey = getIdempotencyKey(req)

    if (effectiveType === 'Fixo') {
      const creditsToCreate: FirebaseFirestore.DocumentData[] = []
      const currentYear = startDateObj.getFullYear()
      const baseDay = startDateObj.getDate() || 1
      const current = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), baseDay, 12, 0, 0)

      while (current.getFullYear() === currentYear && current <= new Date(currentYear, 11, 31, 23, 59, 59)) {
        const creditForMonth = {
          ...baseCreditData,
          date: new Date(current),
          month: current.toLocaleString('pt-BR', { month: 'long' }),
          year: current.getFullYear(),
          isTemplate: true,
          frequency: frequency || 'monthly',
          startDate: startDateObj,
          endDate: endDateObj,
          createdAt: now,
          updatedAt: now,
        }
        creditsToCreate.push(creditForMonth)
        current.setMonth(current.getMonth() + 1)
      }

      const operation = await runIdempotentFinancialWrite(workspaceId, 'create-credit', idempotencyKey, (transaction) => {
        creditsToCreate.forEach((credit) => transaction.set(db.collection('workspaces').doc(workspaceId).collection('credits').doc(), credit))
        writeFinancialPeriodDeltas(transaction, workspaceId, creditsToCreate.flatMap((credit) => calculateEntryDeltas('credit', null, credit)))
        return { message: 'Receitas fixas criadas com sucesso!', count: creditsToCreate.length }
      })
      return NextResponse.json(operation.result, { status: operation.replayed ? 200 : 201 })
    }

    const newCreditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc()
    const operation = await runIdempotentFinancialWrite(workspaceId, 'create-credit', idempotencyKey, (transaction) => {
      transaction.set(newCreditRef, baseCreditData)
      writeFinancialPeriodDeltas(transaction, workspaceId, calculateEntryDeltas('credit', null, baseCreditData))
      return { message: 'Receita criada com sucesso!', creditId: newCreditRef.id }
    })
    return NextResponse.json(operation.result, { status: operation.replayed ? 200 : 201 })

  } catch (error) {
    if (error instanceof InvalidWorkspaceReferenceError) {
      return NextResponse.json({ message: error.message, field: error.field }, { status: 400 })
    }
    const searchParams = await params
    console.error(`Erro ao criar crédito para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar crédito' }, { status: 500 })
  }
}
