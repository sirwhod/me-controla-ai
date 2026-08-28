import NextAuth, { DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "@/auth.config"
import { db, firebaseCert } from "./firebase"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { Timestamp } from "firebase-admin/firestore"
import { TRIAL_DAYS } from "./config"
import { verifyPassword } from "./password"
import { consumeRateLimit } from './rate-limit'
import { normalizeEmail } from './email-identity'

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
  session: {
    strategy: "jwt",
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = normalizeEmail(credentials.email as string)
        const password = credentials.password as string

        const rateLimit = await consumeRateLimit('credentials-login', email, 10, 15 * 60 * 1000)
        if (!rateLimit.allowed) return null

        const userQuery = await db.collection("users").where("email", "==", email).limit(1).get()
        if (userQuery.empty) {
          return null
        }

        const userDoc = userQuery.docs[0]
        const userData = userDoc.data()

        if (!userData.password) {
          throw new Error("Esta conta foi criada com o Google. Por favor, entre usando o botão do Google.")
        }

        const isValid = await verifyPassword(password, userData.password)
        if (!isValid) {
          return null
        }

        return {
          id: userDoc.id,
          name: userData.name || "Usuário",
          email: userData.email,
          image: userData.image || null,
          createdAt: userData.createdAt || Date.now(),
          isTrial: userData.isTrial ?? true,
          isSubscribed: userData.isSubscribed ?? false,
          workspaceIds: userData.workspaceIds || [],
        }
      },
    }),
  ],
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
          emailVerified: (user as typeof user & { emailVerified?: Date | null }).emailVerified || null,
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.createdAt = user.createdAt
        token.isTrial = user.isTrial
        token.isSubscribed = user.isSubscribed
        token.workspaceIds = user.workspaceIds || []
      }

      // Never accept authorization-related claims from client-side session.update().
      void trigger
      void session

      const userId = (token.id as string) || (token.sub as string);
      if (userId) {
        try {
          const userDoc = await db.collection("users").doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            token.workspaceIds = userData?.workspaceIds || [];
            if (userData?.createdAt) {
              token.createdAt = userData.createdAt;
            }
            if (userData?.isSubscribed !== undefined) {
              token.isSubscribed = userData.isSubscribed;
            }
          }
        } catch (e) {
          console.error("Erro ao carregar dados do usuário no JWT callback:", e);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const userId = (token.id as string) || (token.sub as string);
        const createdAt = (token.createdAt as number) || Date.now();
        const trialDurationMillis = 1000 * 60 * 60 * 24 * TRIAL_DAYS;

        session.user.id = userId;
        session.user.createdAt = createdAt;
        session.user.isTrial = createdAt > (Date.now() - trialDurationMillis);
        session.user.isSubscribed = (token.isSubscribed as boolean) ?? false;
        session.user.workspaceIds = (token.workspaceIds as string[]) || [];
      }

      return session;
    },
  },
})
