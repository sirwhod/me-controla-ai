import { auth } from '@/app/lib/auth'
import { db, getDownloadURLFromPath, storage } from '@/app/lib/firebase'
import { createCategorySchema } from '@/app/types/financial'
import { NextRequest, NextResponse } from 'next/server'

interface CategoryRouteParams {
  workspaceId: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const categoriesQuery = db.collection('workspaces').doc(workspaceId).collection('categories')
      .orderBy('name', 'asc')

    const querySnapshot = await categoriesQuery.get()

    const categories = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      }
    })

    return NextResponse.json(categories, { status: 200 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao listar categorias para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao listar categorias' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<CategoryRouteParams> }) {
  try {
    const searchParams = await params
    const workspaceId = searchParams.workspaceId

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const imageFile = formData.get('imageFile') as File | null

    const categoryDataFromForm = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
    }

    const validationResult = createCategorySchema.safeParse(categoryDataFromForm)

    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Dados de entrada inválidos para criar categoria.',
        error: validationResult.error.errors.map(e => e.message).join(', '),
      }, { status: 400 })
    }

    const { name, type } = validationResult.data

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
      const iconPath = `categories_icons/${workspaceId}/${Date.now()}_${imageFile.name}`;
      
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

    const newCategoryRef = db.collection('workspaces').doc(workspaceId).collection('categories').doc()

    const newCategoryData = {
      name: name.trim(),
      type: type,
      iconUrl: uploadedIconUrl ?? null, // URL da imagem do Storage
      workspaceId: workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await newCategoryRef.set(newCategoryData)

    return NextResponse.json({ message: 'Categoria criada com sucesso!', categoryId: newCategoryRef.id }, { status: 201 })

  } catch (error) {
    const searchParams = await params
    console.error(`Erro ao criar categoria para workspace ${searchParams.workspaceId}:`, error)
    return NextResponse.json({ message: 'Erro interno do servidor ao criar categoria' }, { status: 500 })
  }
}
