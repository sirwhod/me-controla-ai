'use server'

import { db } from "@/app/lib/firebase"
import { hashPassword } from "@/app/lib/password"
import { Timestamp } from "firebase-admin/firestore"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(100, { message: "O nome não pode exceder 100 caracteres." }),
  email: z.string().trim().email({ message: "Insira um endereço de e-mail válido." }).toLowerCase(),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }).max(100, { message: "A senha não pode exceder 100 caracteres." }),
})

export type RegisterInput = z.infer<typeof registerSchema>

interface RegisterResult {
  success: boolean
  message: string
  error?: string
}

export async function registerAction(data: RegisterInput): Promise<RegisterResult> {
  try {
    const validation = registerSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.errors[0]?.message || "Dados de cadastro inválidos.",
        error: "Validação falhou",
      }
    }

    const { name, email, password } = validation.data

    // Verificar se já existe usuário cadastrado com este e-mail
    const existingUsers = await db.collection("users").where("email", "==", email).limit(1).get()
    if (!existingUsers.empty) {
      return {
        success: false,
        message: "Já existe uma conta cadastrada com este e-mail. Tente fazer login.",
        error: "E-mail duplicado",
      }
    }

    const hashedPassword = await hashPassword(password)
    const newUserRef = db.collection("users").doc()
    const newWorkspaceRef = db.collection("workspaces").doc()

    const personalWorkspaceData = {
      name: `Caixinha de ${name}`,
      ownerId: newUserRef.id,
      members: [newUserRef.id],
      type: "personal",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const newUserData = {
      name,
      email,
      password: hashedPassword,
      workspaceIds: [newWorkspaceRef.id],
      createdAt: Timestamp.now().toMillis(),
      isTrial: true,
      isSubscribed: false,
      updatedAt: new Date(),
    }

    // Criação atômica via batch
    const batch = db.batch()
    batch.set(newWorkspaceRef, personalWorkspaceData)
    batch.set(newUserRef, newUserData)

    await batch.commit()

    return {
      success: true,
      message: "Conta criada com sucesso! Faça login para continuar.",
    }
  } catch (error) {
    console.error("Erro no cadastro de usuário:", error)
    return {
      success: false,
      message: "Ocorreu um erro interno ao criar sua conta. Tente novamente mais tarde.",
      error: "Erro do servidor",
    }
  }
}
