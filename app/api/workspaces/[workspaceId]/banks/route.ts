"use server"

import { checkIsWorkspaceMember } from '@/app/api/utils/check-is-workspace-member'
import { auth } from '@/app/lib/auth'
import { db, getDownloadURLFromPath, storage } from '@/app/lib/firebase'
import { createBankSchema } from '@/app/types/financial'
import { serializeFirestoreDate } from '@/app/lib/date-utils'
import { NextRequest, NextResponse } from 'next/server'

interface BankRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: {params: Promise<BankRouteParams>}) {
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

    const workspaceRef = db.collection('workspaces').doc(workspaceId)
    const banksSnapshot = await workspaceRef.collection('banks').orderBy('name', 'asc').get()
    const cardCounts = await Promise.all(
      banksSnapshot.docs.map(async (bankDoc) => {
        const countSnapshot = await workspaceRef
          .collection('cards')
          .where('bankId', '==', bankDoc.id)
          .count()
          .get()

        return [bankDoc.id, countSnapshot.data().count] as const
      })
    )
    const cardsByBank = new Map(cardCounts)

    const banks = banksSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        cardsCount: cardsByBank.get(doc.id) || 0,
        createdAt: serializeFirestoreDate(data.createdAt),
        updatedAt: serializeFirestoreDate(data.updatedAt),
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

    const isMember = await checkIsWorkspaceMember({
      workspaceId, 
      workspaceIds: session.user.workspaceIds,
      userId: session.user.id,
    })
    
    if (!isMember) {
       return NextResponse.json({ message: 'Acesso negado ao workspace' }, { status: 403 })
    }

    const formData = await req.formData()
    const imageFile = formData.get('imageFile') as File | null

    const bankDataFromForm = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      pixKey: formData.get('pixKey') as string | null,
      pixKeyType: formData.get('pixKeyType') as string | null,
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

    const { name, code, pixKey, pixKeyType, invoiceClosingDay, invoiceDueDate } = validationResult.data
    let uploadedIconUrl: string | undefined = undefined

    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) { // 5MB
        return NextResponse.json({ message: 'Arquivo muito grande (máx 5MB).' }, { status: 400 });
      }
      const acceptedTypes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      };
      const ext = acceptedTypes[imageFile.type];
      if (!ext) {
        return NextResponse.json({ message: 'Tipo de arquivo inválido. Permitido apenas JPEG, PNG ou WebP.' }, { status: 400 });
      }

      // Fazer upload para o Firebase Storage usando o SDK Admin com nome seguro e aleatório
      const fileBuffer = Buffer.from(await imageFile.arrayBuffer());
      const safeFileName = `${crypto.randomUUID()}.${ext}`;
      const iconPath = `bank_icons/${workspaceId}/${safeFileName}`;
      
      const storageFile = storage.file(iconPath);
      await storageFile.save(fileBuffer, {
        metadata: { contentType: imageFile.type },
      });

      uploadedIconUrl = await getDownloadURLFromPath(iconPath); 
      if (!uploadedIconUrl) {
         console.error("Não foi possível gerar a URL de download para:", iconPath);
      }
    }

    const newBankRef = db.collection('workspaces').doc(workspaceId).collection('banks').doc() // Firestore gera ID

    const newBankData = {
      name: name.trim(),
      code: code?.trim() || null,
      iconUrl: uploadedIconUrl ?? null, // URL da imagem do Storage
      pixKey: pixKey?.trim() || null,
      pixKeyType: pixKeyType || null,
      workspaceId: workspaceId,
      invoiceClosingDay: invoiceClosingDay ?? null,
      invoiceDueDate: invoiceDueDate ?? null,
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
