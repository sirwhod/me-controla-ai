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

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HandCoins,
      isActive: true,
      items: [
        {
          title: "Despesas",
          url: "/dashboard/debits",
        },
        {
          title: "Receitas",
          url: "/dashboard/credits",
        },
      ],
    },
    {
      title: "Configurações",
      url: "/manage",
      icon: Settings2,
      items: [
        {
          title: "Bancos",
          url: "/manage/banks",
        },
        {
          title: "Categorias",
          url: "/manage/categories",
        },
        {
          title: "Metas",
          url: "/manage/goals",
        },
      ],
    },
  ],
  navSecondary: [
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
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { workspaceActive } = useWorkspace()

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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
