"use client"

import * as React from "react"
import {
  CircleDollarSign,
  LayoutDashboard,
  ReceiptText,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/app/components/nav-main"
import { NavUser } from "@/app/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/app/components/ui/sidebar"
import { useWorkspace } from "../hooks/use-workspace"
import { useDateFilter } from "../contexts/date-filter-context"
import { Logo } from "./logo"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { workspaceActive, activeWorkspaceId, isLoading } = useWorkspace()
  const { queryString } = useDateFilter()
  const wsId = activeWorkspaceId || workspaceActive?.id || ""
  // Never expose workspace routes without an id during the initial hydration.
  const prefix = wsId ? `/${wsId}` : "#"

  const navMain = React.useMemo(() => [
    {
      title: "Dashboard",
      url: `${prefix}/dashboard${queryString}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Despesas",
      url: `${prefix}/dashboard/debits${queryString}`,
      icon: ReceiptText,
    },
    {
      title: "Receitas",
      url: `${prefix}/dashboard/credits${queryString}`,
      icon: CircleDollarSign,
    },
  ], [prefix, queryString])

  const settingsItems = React.useMemo(() => [
    {
      title: "Configurações",
      url: `${prefix}/manage${queryString}`,
      icon: Settings2,
      items: [
        {
          title: "Bancos",
          url: `${prefix}/manage/banks${queryString}`,
        },
        {
          title: "Cartões de Crédito",
          url: `${prefix}/manage/cards${queryString}`,
        },
        {
          title: "Categorias",
          url: `${prefix}/manage/categories${queryString}`,
        },
        {
          title: "Metas",
          url: `${prefix}/manage/goals${queryString}`,
        },
        {
          title: "Responsáveis",
          url: `${prefix}/manage/responsibles${queryString}`,
        },
        {
          title: "Membros & Acesso",
          url: `${prefix}/manage/members${queryString}`,
        },
      ],
    },
  ], [prefix, queryString])

  return (
    <Sidebar
      variant="inset"
      collapsible="none"
      className="p-3 pr-2"
      {...props}
    >
      <SidebarHeader className="px-3 pb-5 pt-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-14 px-1 hover:bg-transparent active:bg-transparent">
              <div>
                <div className="flex size-10 shrink-0 items-center justify-center">
                  <Logo className="size-7 text-primary" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-base font-semibold tracking-tight">MeControla.AI</span>
                  <span className="mt-0.5 truncate text-xs text-muted-foreground">
                    {isLoading || !workspaceActive
                      ? "Carregando caixinha..."
                      : workspaceActive.type === "personal"
                        ? "Pessoal"
                        : "Compartilhado"}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <NavMain items={navMain} />
        <SidebarSeparator className="my-1" />
        <NavMain items={settingsItems} showLabel={false} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 px-3 py-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
