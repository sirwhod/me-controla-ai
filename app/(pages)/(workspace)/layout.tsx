"use client"

import { AppSidebar } from "@/app/components/app-sidebar"
import QueryProvider from "@/app/components/query-provider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar"
import { WorkspaceProvider } from "@/app/contexts/workspace-context"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/sign-in')
    }
  }, [status])
  return (
    <SidebarProvider>
      <QueryProvider>
        <WorkspaceProvider>
          <AppSidebar />
          <SidebarInset>
            {children}
          </SidebarInset>
        </WorkspaceProvider>
      </QueryProvider>
    </SidebarProvider>
  )
}
