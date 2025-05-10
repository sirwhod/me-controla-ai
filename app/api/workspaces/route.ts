import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { auth } from '@/app/lib/auth';
import { db } from '@/app/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id

    if (!userId) {
        return NextResponse.json({ message: 'UID do usuário não encontrado na sessão' }, { status: 500 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ message: 'Nome do workspace inválido' }, { status: 400 });
    }

    const newWorkspaceRef = db.collection('workspaces').doc();

    const newWorkspaceData = {
      name: name.trim(),
      ownerId: userId,
      members: [userId],
      type: 'personal',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await newWorkspaceRef.set(newWorkspaceData);

    const userRef = db.collection('users').doc(userId);

    const userDoc = await userRef.get();

    if (userDoc.exists) {
        await userRef.update({
          workspaceIds: FieldValue.arrayUnion(newWorkspaceRef.id),
          updatedAt: new Date(),
        });
    } else {
       console.warn(`Documento do usuário ${userId} não encontrado ao tentar adicionar workspaceId.`);
    }

    return NextResponse.json({ message: 'Workspace criado com sucesso!', workspaceId: newWorkspaceRef.id }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar workspace:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao criar workspace' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!userId) {
        return NextResponse.json({ message: 'UID do usuário não encontrado na sessão' }, { status: 500 });
    }

    const workspacesQuery = db.collection('workspaces').where('members', 'array-contains', userId);

    const querySnapshot = await workspacesQuery.get();

    const workspaces = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    });
    
    return NextResponse.json(workspaces, { status: 200 });

  } catch (error) {
    console.error('Erro ao listar workspaces:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao listar workspaces' }, { status: 500 });
  }
}