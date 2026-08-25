import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/manage')

      if (isProtected) {
        if (isLoggedIn) return true
        return false // Redireciona usuários não autenticados para a página inicial/login
      }
      return true
    },
  },
} satisfies NextAuthConfig
