import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { db, firebaseCert } from "./firebase"
import { FirestoreAdapter } from "@auth/firebase-adapter"

import { FieldValue, Timestamp } from "firebase-admin/firestore"
import { TRIAL_DAYS } from "./config"


declare module "next-auth" {
  interface Session {
    user: {
      createdAt: number
      isTrial: boolean
      workspaceIds: string[]
      isSubscribed: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    createdAt: number
    isTrial?: boolean
    isSubscribed?: boolean
    workspaceIds?: string[] 
    email?: string
    name?: string
    image?: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: FirestoreAdapter({
    credential: firebaseCert
  }),
  providers: [Google({
    clientId: process.env.AUTH_GOOGLE_ID ?? '',
    clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
  })],
  events: {
    createUser: async ({ user }) => {
      console.log(`Entrou em create user!`)
      if (!user.id) return;
      const userRef = db.collection("users").doc(user.id);

      await userRef.update({
        createdAt: Timestamp.now().toMillis(),
        workspaceIds: [],
        isTrial: true,
        isSubscribed: false,
      });

      // --- Lógica para Criar o Workspace Pessoal Automaticamente ---

      const newWorkspaceRef = db.collection('workspaces').doc();

      const personalWorkspaceData = {
        name: `Workspace Pessoal de ${user.name || user.email || 'Novo Usuário'}`,
        ownerId: user.id,
        members: [user.id],
        type: 'personal',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await newWorkspaceRef.set(personalWorkspaceData);

      await userRef.update({
        workspaceIds: FieldValue.arrayUnion(newWorkspaceRef.id),
        updatedAt: new Date(),
      });

      console.log(`[Auth.js Event] Workspace pessoal ${newWorkspaceRef.id} criado automaticamente para o usuário: ${user.id}`);

      // --- Fim da Lógica para Criar o Workspace Pessoal ---
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (!session.user) return session;

      session.user.createdAt = user.createdAt;
      session.user.isTrial = new Date(user.createdAt).getTime() > new Date().getTime() - 1000 * 60 * 60 * 24 * TRIAL_DAYS || false;
      session.user.isSubscribed = user.isSubscribed ?? false;
      session.user.workspaceIds = user.workspaceIds ?? [];

      return session;
    },
  },
})