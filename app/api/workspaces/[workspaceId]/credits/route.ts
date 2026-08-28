import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member';
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createCreditSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestId, logFirestoreQuery, logHttpRequest } from '@/app/lib/observability'

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

    let creditsQuery: FirebaseFirestore.Query = db
      .collection('workspaces')
      .doc(workspaceId)
      .collection('credits')

    if (month && month !== 'todos') {
      creditsQuery = creditsQuery.where('month', '==', month.toLowerCase())
    }
    if (year && year !== 'todos') {
      creditsQuery = creditsQuery.where('year', '==', Number(year))
    }

    const querySnapshot = await creditsQuery.get()
    logFirestoreQuery({ requestId, endpoint: '/api/workspaces/:workspaceId/credits', collection: 'credits', operation: 'query.get', documents: querySnapshot.size, durationMs: performance.now() - startedAt, userId: session.user.id, workspaceId, origin: 'credits.list' })

    const credits = querySnapshot.docs.map(doc => {
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
    return NextResponse.json(credits, { status: 200, headers: { 'x-request-id': requestId } })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar créditos para workspace ${searchParams.workspaceId}:`, error)
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
      proofUrl,
      status,
    } = validationResult.data

    const effectiveType = type || 'Comum'
    const dateObj = new Date(date || startDate || new Date().toISOString())
    const startDateObj = startDate ? new Date(startDate) : dateObj
    const endDateObj = endDate ? new Date(endDate) : null
    const month = dateObj.toLocaleString('pt-BR', { month: 'long' }) 
    const year = dateObj.getFullYear()
    const now = new Date()

    let bankName = ""
    let bankImageUrl = ""
    if (bankId) {
      const bankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc(bankId)
      const bankDoc = await bankRef.get()
      if (bankDoc.exists) {
        bankName = bankDoc.data()?.name || ""
        bankImageUrl = bankDoc.data()?.iconUrl || ""
      }
    }

    let categoryName = ""
    let categoryUrl = ""
    if (categoryId) {
      const categoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc(categoryId)
      const categoryDoc = await categoryRef.get()
      if (categoryDoc.exists) {
        categoryName = categoryDoc.data()?.name || ""
        categoryUrl = categoryDoc.data()?.icon || ""
      }
    }

    let responsibleName = ""
    if (responsibleId) {
      const respDoc = await db.collection('workspaces').doc(workspaceId).collection('responsibles').doc(responsibleId).get()
      if (respDoc.exists) {
        responsibleName = respDoc.data()?.name || ""
      }
    }

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
      proofUrl: proofUrl?.trim() || null,
      status: status || 'received',
      workspaceId: workspaceId,
      userId: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    if (effectiveType === 'Fixo') {
      const creditsToCreate = []
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

      const batch = db.batch()
      creditsToCreate.forEach((credit) => {
        const ref = db.collection('workspaces').doc(workspaceId).collection('credits').doc()
        batch.set(ref, credit)
      })
      await batch.commit()

      return NextResponse.json({ message: 'Receitas fixas criadas com sucesso!', count: creditsToCreate.length }, { status: 201 })
    }

    const newCreditRef = db.collection('workspaces').doc(workspaceId).collection('credits').doc()
    await newCreditRef.set(baseCreditData)

    return NextResponse.json({ message: 'Receita criada com sucesso!', creditId: newCreditRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar crédito para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar crédito' }, { status: 500 })
  }
}
