"use client"

import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/app/components/ui/sidebar"
import Link from "@/app/components/context-link"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
  showLabel = true,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    exact?: boolean
    badge?: string
    items?: {
      title: string
      url: string
    }[]
  }[]
  showLabel?: boolean
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="px-2 py-1">
      {showLabel ? <SidebarGroupLabel className="px-2 text-[11px] font-medium">Caixinha</SidebarGroupLabel> : null}
      <SidebarMenu className="gap-1.5">
        {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={item.exact
                  ? pathname === item.url.split("?")[0]
                  : pathname.startsWith(item.url.split("?")[0])}
                className="h-10 rounded-xl px-3 font-medium data-[active=true]:shadow-sm"
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                  {item.badge ? <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground group-data-[collapsible=icon]:hidden">{item.badge}</span> : null}
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname.startsWith(subItem.url.split("?")[0])}
                            className="h-8 rounded-lg"
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
              ) : null}
            </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
