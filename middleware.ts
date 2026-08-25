export { auth as middleware } from "@/app/lib/auth"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/manage/:path*",
    "/api/workspaces/:path*",
  ],
}
