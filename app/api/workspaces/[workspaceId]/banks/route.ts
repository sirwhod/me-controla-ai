import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { createBankSchema } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

interface BankRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: {params: Promise<BankRouteParams>}) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    console.log('workspaceId', workspaceId)

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    // TODO: Criar função de validação
    // const isMember = await checkIsWorkspaceMember(workspaceId, session.user.id) // Função utilitária
    // if (!isMember) {
    //    return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    // }

    const banksQuery = db.collection('workspaces').doc(workspaceId).collection('banks')
      .orderBy('name', 'asc')

    const querySnapshot = await banksQuery.get()

    const banks = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      }
    })

    return NextResponse.json(banks, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar bancos para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar bancos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: {params: Promise<BankRouteParams>}) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    // TODO: Criar função de validação
    // const isMember = await checkIsWorkspaceMember(workspaceId, session.user.id) // Função utilitária
    // if (!isMember) {
    //    return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    // }

    const body = await req.json()
    const validationResult = createBankSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar banco.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, code, iconUrl } = validationResult.data

    const newBankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc() // Firestore gera ID

    const newBankData = {
      name: name.trim(),
      code: code?.trim() || null,
      iconUrl: iconUrl?.trim() || null,
      workspaceId: workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newBankRef.set(newBankData)
    return NextResponse.json({ message: 'Banco criado com sucesso!', bankId: newBankRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar banco para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar banco' }, { status: 500 })
  }
}
