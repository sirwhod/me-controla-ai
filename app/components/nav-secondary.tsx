import * as React from "react"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar"
import Link from "@/app/components/context-link"
import { cn } from "@/app/lib/utils"
import { Badge } from "@/app/components/ui/badge"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url?: string
    icon: LucideIcon
    disabled?: boolean
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props} className={cn("px-2", props.className)}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const content = (
              <>
                <item.icon />
                <span>{item.title}</span>
                {item.disabled && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    Em breve
                  </Badge>
                )}
              </>
            )

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  disabled={item.disabled}
                  className="h-9 rounded-xl px-3 text-muted-foreground hover:text-sidebar-accent-foreground"
                >
                  {item.disabled ? (
                    <button type="button" aria-label={`${item.title} — Em breve`}>
                      {content}
                    </button>
                  ) : (
                    <Link href={item.url!}>{content}</Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
