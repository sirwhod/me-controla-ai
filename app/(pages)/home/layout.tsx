import { AppSidebar } from "@/app/components/app-sidebar"
import QueryProvider from "@/app/components/query-provider";
import {
  SidebarInset,
  SidebarProvider,
} from "@/app/components/ui/sidebar"
import { WorkspaceProvider } from "@/app/contexts/workspace-context";
import { SessionProvider } from "next-auth/react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  )
}
