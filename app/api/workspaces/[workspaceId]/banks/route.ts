"use server"

import { auth } from '@/app/lib/auth'
import { db, getDownloadURLFromPath, storage } from '@/app/lib/firebase'
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

    const formData = await req.formData()
    const imageFile = formData.get('imageFile') as File | null

    const bankDataFromForm = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      invoiceClosingDay: formData.get('invoiceClosingDay') as string | null, // Vem como string
      invoiceDueDate: formData.get('invoiceDueDate') as string | null,     // Vem como string
    }

    const validationResult = createBankSchema.safeParse(bankDataFromForm)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar banco.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, code, invoiceClosingDay, invoiceDueDate } = validationResult.data
    let uploadedIconUrl: string | undefined = undefined

    if (imageFile) {
      // Validação básica do arquivo no backend (opcional, já que o frontend validou)
      if (imageFile.size > 10 * 1024 * 1024) { // 10MB
        return NextResponse.json({ message: 'Arquivo muito grande (máx 10MB).' }, { status: 400 });
      }
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!acceptedTypes.includes(imageFile.type)) {
        return NextResponse.json({ message: 'Tipo de arquivo inválido.' }, { status: 400 });
      }

      // Fazer upload para o Firebase Storage usando o SDK Admin
      const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
      const iconPath = `bank_icons/${workspaceId}/${Date.now()}_${imageFile.name}`;
      
      const storageFile = storage.file(iconPath); // storage é o bucket do firebaseAdmin
      await storageFile.save(fileBuffer, {
        metadata: { contentType: imageFile.type },
      });

      // Obter a URL de download (usando sua função ou gerando uma URL pública/assinada)
      // Se sua getDownloadURLFromPath já usa o 'storage.file(path)' e retorna a URL, ótimo.
      uploadedIconUrl = await getDownloadURLFromPath(iconPath); 
      if (!uploadedIconUrl) {
         // Lidar com o caso em que a URL não pôde ser gerada, talvez por um erro na função
         console.error("Não foi possível gerar a URL de download para:", iconPath);
         // Você pode decidir continuar sem iconUrl ou retornar um erro
      }
    }

    const newBankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc() // Firestore gera ID

    const newBankData = {
      name: name.trim(),
      code: code?.trim(),
      iconUrl: uploadedIconUrl ?? null, // URL da imagem do Storage
      workspaceId: workspaceId,
      invoiceClosingDay: invoiceClosingDay ?? null, // Zod já converteu para número ou null
      invoiceDueDate: invoiceDueDate ?? null,     // Zod já converteu para número ou null
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
