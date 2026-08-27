import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manage/:path*",
    "/:workspaceId/dashboard/:path*",
    "/:workspaceId/manage/:path*",
    "/api/workspaces/:path*",
  ],
}
