'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { auth } from '../lib/auth'
import { db } from '../lib/firebase'
import { CreateWorkspaceRequest } from '../components/workspace-form'
import { z } from 'zod'

const workspaceServerSchema = z.object({
  name: z.string().trim().min(2, { message: 'O nome da caixinha precisa ter pelo menos 2 caracteres.' }).max(100, { message: 'O nome da caixinha não pode exceder 100 caracteres.' }),
  type: z.enum(['personal', 'shared'], { errorMap: () => ({ message: 'Tipo de caixinha inválido.' }) }),
})

interface CreateWorkspaceResult {
  success: boolean
  message: string
  workspaceId?: string
  error?: string
}

export async function createWorkspaceAction(data: CreateWorkspaceRequest): Promise<CreateWorkspaceResult> {
  try {
    const session = await auth()

    if (!session?.user) {
      return { success: false, message: 'Não autenticado', error: 'Usuário não autenticado' }
    }

    const userId = session.user.id

    if (!userId) {
      return { success: false, message: 'UID do usuário não encontrado na sessão', error: 'UID não disponível' }
    }

    const validation = workspaceServerSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0]?.message || 'Dados inválidos.',
        error: 'Validação falhou',
      }
    }

    const { name, type } = validation.data

    const newWorkspaceRef = db.collection('workspaces').doc()
    const userRef = db.collection('users').doc(userId)

    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return { success: false, message: 'Registro do usuário não encontrado no banco de dados', error: 'Usuário inexistente' }
    }

    const newWorkspaceData = {
      name: name.trim(),
      ownerId: userId,
      members: [userId],
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Criação atômica via batch para garantir consistência
    const batch = db.batch()
    batch.set(newWorkspaceRef, newWorkspaceData)
    batch.update(userRef, {
      workspaceIds: FieldValue.arrayUnion(newWorkspaceRef.id),
      updatedAt: new Date(),
    })

    await batch.commit()

    return { success: true, message: 'Caixinha criada com sucesso!', workspaceId: newWorkspaceRef.id }

  } catch (error: unknown) {
    console.error('Erro no Server Action createWorkspaceAction:', error)
    return { success: false, message: 'Erro interno do servidor ao criar caixinha' }
  }
}
