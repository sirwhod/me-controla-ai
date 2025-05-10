'use server';

import { FieldValue } from 'firebase-admin/firestore'; // Importe FieldValue
import { auth } from '../lib/auth';
import { db } from '../lib/firebase';

// Defina o tipo de retorno da ação para melhor tipagem no cliente
interface CreateWorkspaceResult {
  success: boolean;
  message: string;
  workspaceId?: string;
  error?: string;
}

export async function createWorkspaceAction(formData: FormData): Promise<CreateWorkspaceResult> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, message: 'Não autenticado', error: 'Usuário não autenticado' };
    }

    const userId = session.user.id;

    if (!userId) {
        return { success: false, message: 'UID do usuário não encontrado na sessão', error: 'UID não disponível' };
    }

    const name = formData.get('name') as string | null;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return { success: false, message: 'Nome do workspace inválido', error: 'Nome inválido' };
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

    return { success: true, message: 'Workspace criado com sucesso!', workspaceId: newWorkspaceRef.id };

  } catch (error: any) {
    console.error('Erro no Server Action createWorkspaceAction:', error);
    return { success: false, message: 'Erro interno do servidor ao criar workspace', error: error.message || 'Erro desconhecido' };
  }
}
