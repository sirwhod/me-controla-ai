import NextAuth, { DefaultSession } from "next-auth"
import { authConfig } from "@/auth.config"
import { db, firebaseCert } from "./firebase"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { Timestamp } from "firebase-admin/firestore"
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
  ...authConfig,
  adapter: FirestoreAdapter({
    credential: firebaseCert
  }),
  events: {
    createUser: async ({ user }) => {
      if (!user.id) return;
      try {
        const batch = db.batch();
        const userRef = db.collection("users").doc(user.id);
        const newWorkspaceRef = db.collection("workspaces").doc();

        const personalWorkspaceData = {
          name: `Caixinha de ${user.name || user.email || 'Novo Usuário'}`,
          ownerId: user.id,
          members: [user.id],
          type: 'personal',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        batch.set(newWorkspaceRef, personalWorkspaceData);

        batch.update(userRef, {
          createdAt: Timestamp.now().toMillis(),
          workspaceIds: [newWorkspaceRef.id],
          isTrial: true,
          isSubscribed: false,
          updatedAt: new Date(),
        });

        await batch.commit();
        console.log(`[Auth.js Event] Caixinha pessoal ${newWorkspaceRef.id} criado automaticamente para o usuário: ${user.id}`);
      } catch (error) {
        console.error(`[Auth.js Event] Erro ao criar workspace inicial para usuário ${user.id}:`, error);
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, user }) {
      if (!session.user) return session;

      const userCreatedAt = user.createdAt ? Number(user.createdAt) : Date.now();
      const trialDurationMillis = 1000 * 60 * 60 * 24 * TRIAL_DAYS;

      session.user.createdAt = userCreatedAt;
      session.user.isTrial = userCreatedAt > (Date.now() - trialDurationMillis);
      session.user.isSubscribed = user.isSubscribed ?? false;
      session.user.workspaceIds = user.workspaceIds ?? [];

      return session;
    },
  },
})