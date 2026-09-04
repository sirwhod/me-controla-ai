"use client"
import * as React from "react"
import Link from "@/app/components/context-link"
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { Logo } from "./logo"
import { useWorkspace } from "@/app/hooks/use-workspace"

export function MobileHeader() {
  const { activeWorkspaceId, workspaceActive } = useWorkspace()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = React.useState(0)
  React.useEffect(() => { fetch('/api/notifications/unread-count').then(r => r.ok ? r.json() : null).then(data => setUnreadCount(data?.count || 0)).catch(() => undefined) }, [pathname])
  const prefix = activeWorkspaceId || workspaceActive?.id
  const isNotifications = pathname.endsWith('/notifications')
  return <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md min-[768px]:hidden"><Link href={prefix ? `/${prefix}/dashboard` : "/dashboard"} className="flex items-center gap-2" aria-label="MeControla.AI"><Logo className="h-7 w-7 text-primary" /><span className="text-base font-semibold tracking-tight">MeControla<span className="text-primary">.AI</span></span></Link><Link href={prefix ? `/${prefix}/notifications` : "/notifications"} aria-label="Notificações" aria-current={isNotifications ? 'page' : undefined} className={`relative rounded-full p-2 transition-colors ${isNotifications ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" aria-label={`${unreadCount} notificações não lidas`} />}</Link></header>
}
