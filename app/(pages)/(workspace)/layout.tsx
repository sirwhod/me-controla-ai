"use client"

import { AppSidebar } from "@/app/components/app-sidebar"
import QueryProvider from "@/app/components/query-provider"
import {
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar"
import { WorkspaceProvider } from "@/app/contexts/workspace-context"
import { DateFilterProvider } from "@/app/contexts/date-filter-context"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Suspense, useEffect } from "react"
import { Loader } from "@/app/components/ui/loader"

import { MobileNav } from "@/app/components/mobile-nav"

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
        <Suspense
          fallback={
            <div className="flex h-screen w-full items-center justify-center">
              <Loader size="lg" text="Carregando..." />
            </div>
          }
        >
          <DateFilterProvider>
            <WorkspaceProvider>
              <AppSidebar />
              <SidebarInset className="pb-20 md:pb-0">
                {children}
              </SidebarInset>
              <MobileNav />
            </WorkspaceProvider>
          </DateFilterProvider>
        </Suspense>
      </QueryProvider>
    </SidebarProvider>
  )
}
