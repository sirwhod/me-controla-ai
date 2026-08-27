"use client"

import * as React from "react"
import {
  HandCoins,
  LifeBuoy,
  Send,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/app/components/nav-main"
import { NavSecondary } from "@/app/components/nav-secondary"
import { NavUser } from "@/app/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar"
import { useWorkspace } from "../hooks/use-workspace"
import { Logo } from "./logo"

const navSecondaryData = [
  {
    title: "Suporte",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "Feedback",
    url: "#",
    icon: Send,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { workspaceActive } = useWorkspace()
  const wsId = workspaceActive?.id || ""
  const prefix = wsId ? `/${wsId}` : ""

  const navMain = React.useMemo(() => [
    {
      title: "Dashboard",
      url: `${prefix}/dashboard`,
      icon: HandCoins,
      isActive: true,
      items: [
        {
          title: "Despesas",
          url: `${prefix}/dashboard/debits`,
        },
        {
          title: "Receitas",
          url: `${prefix}/dashboard/credits`,
        },
      ],
    },
    {
      title: "Configurações",
      url: `${prefix}/manage`,
      icon: Settings2,
      items: [
        {
          title: "Bancos",
          url: `${prefix}/manage/banks`,
        },
        {
          title: "Cartões de Crédito",
          url: `${prefix}/manage/cards`,
        },
        {
          title: "Categorias",
          url: `${prefix}/manage/categories`,
        },
        {
          title: "Metas",
          url: `${prefix}/manage/goals`,
        },
        {
          title: "Responsáveis",
          url: `${prefix}/manage/responsibles`,
        },
        {
          title: "Membros & Acesso",
          url: `${prefix}/manage/members`,
        },
      ],
    },
  ], [prefix])

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <Logo className="text-primary min-w-8 min-h-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">MeControla.AI</span>
                  <span className="truncate text-xs">
                    {
                      workspaceActive?.type && workspaceActive.type === "personal" ?
                      "Pessoal" :
                      "Compartilhado"
                    }
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondaryData} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
