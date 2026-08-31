"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
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
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive || pathname.startsWith(item.url.split("?")[0])}
          >
            <SidebarMenuItem>
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
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="right-2 top-2.5 data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
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
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
