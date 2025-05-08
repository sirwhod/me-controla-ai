import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { initializeApp, getApps, cert } from 'firebase-admin/app'

import { JWT } from "next-auth/jwt"
import { User, Session, Account, Profile } from "next-auth"


if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY_JSON as string)),
  })
}

export const authOptions: AuthOptions = {
  providers: [
    // Provedor Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT, user: User | null | undefined, account: Account | null, profile?: Profile, isNewUser?: boolean }): Promise<JWT> {
        if (user?.firebaseIdToken) {
            token.firebaseIdToken = user.firebaseIdToken
        }
        return token
    },
    async session({ session, token }: { session: Session, token: JWT }): Promise<Session> {
        if (token.firebaseIdToken) {
            session.firebaseIdToken = token.firebaseIdToken
        }
        return session
    },
  },
}

export default NextAuth(authOptions)