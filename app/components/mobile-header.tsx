"use client"
import Link from "@/app/components/context-link"
import { Bell } from "lucide-react"
import { Logo } from "./logo"
import { useWorkspace } from "@/app/hooks/use-workspace"

export function MobileHeader() {
  const { activeWorkspaceId, workspaceActive } = useWorkspace()
  const prefix = activeWorkspaceId || workspaceActive?.id
  return <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md min-[768px]:hidden"><Link href={prefix ? `/${prefix}/dashboard` : "/dashboard"} className="flex items-center gap-2" aria-label="MeControla.AI"><Logo className="h-7 w-7 text-primary" /><span className="text-base font-semibold tracking-tight">MeControla<span className="text-primary">.AI</span></span></Link><Link href={prefix ? `/${prefix}/notifications` : "/notifications"} aria-label="Notificações" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><Bell className="h-5 w-5" /></Link></header>
}
