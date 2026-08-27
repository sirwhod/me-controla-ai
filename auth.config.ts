import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected =
        nextUrl.pathname.includes('/dashboard') ||
        nextUrl.pathname.includes('/manage') ||
        nextUrl.pathname.startsWith('/api/workspaces')

      if (isProtected) {
        if (isLoggedIn) return true
        return false // Redireciona para /sign-in
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.createdAt = user.createdAt
        token.isTrial = user.isTrial
        token.isSubscribed = user.isSubscribed
        token.workspaceIds = user.workspaceIds || []
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string)
        session.user.createdAt = (token.createdAt as number) || Date.now()
        session.user.isTrial = (token.isTrial as boolean) ?? true
        session.user.isSubscribed = (token.isSubscribed as boolean) ?? false
        session.user.workspaceIds = (token.workspaceIds as string[]) || []
      }
      return session
    },
  },
} satisfies NextAuthConfig
