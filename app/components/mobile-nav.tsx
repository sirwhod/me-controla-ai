"use client"

import * as React from "react"
import Link from "@/app/components/context-link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  HandCoins,
  PieChart,
  MoreHorizontal,
  Landmark,
  Tags,
  Target,
  Users,
  UserCheck,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/app/lib/utils"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Button } from "@/app/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/ui/sheet"

export function MobileNav() {
  const pathname = usePathname()
  const { workspaceActive, activeWorkspaceId } = useWorkspace()
  const { queryString } = useDateFilter()
  const { data: session } = useSession()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const user = session?.user
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U"

  const wsId = activeWorkspaceId || workspaceActive?.id || ""
  const prefix = wsId ? `/${wsId}` : ""

  const isDebitsActive = pathname.includes("/dashboard/debits")
  const isCreditsActive = pathname.includes("/dashboard/credits")
  const isDashboardActive =
    pathname.endsWith("/dashboard") ||
    (pathname.includes("/dashboard") && !isDebitsActive && !isCreditsActive)
  const isManageActive = pathname.includes("/manage")

  const manageSections = [
    {
      title: "Acesso & Pessoas",
      links: [
        {
          title: "Membros & Acesso",
          description: "Acessos e compartilhamento",
          href: `${prefix}/manage/members${queryString}`,
          icon: Users,
        },
        {
          title: "Responsáveis",
          description: "Gestão de pessoas e cobrança PIX",
          href: `${prefix}/manage/responsibles${queryString}`,
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Estrutura Financeira",
      links: [
        {
          title: "Bancos & Contas",
          description: "Gerencie contas, saldos e chaves PIX",
          href: `${prefix}/manage/banks${queryString}`,
          icon: Landmark,
        },
        {
          title: "Cartões de Crédito",
          description: "Limites, faturas e dias de vencimento",
          href: `${prefix}/manage/cards${queryString}`,
          icon: CreditCard,
        },
        {
          title: "Categorias",
          description: "Categorias de receitas e despesas",
          href: `${prefix}/manage/categories${queryString}`,
          icon: Tags,
        },
        {
          title: "Metas Financeiras",
          description: "Acompanhamento de objetivos e aportes",
          href: `${prefix}/manage/goals${queryString}`,
          icon: Target,
        },
      ],
    },
    {
      title: "Visão Geral",
      links: [
        {
          title: "Painel de Configurações",
          description: "Visão geral da caixinha",
          href: `${prefix}/manage${queryString}`,
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden border-t border-border/70 bg-background/95 backdrop-blur-md shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {/* 1. Despesas */}
        <Link
          href={`${prefix}/dashboard/debits${queryString}`}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors rounded-lg",
            isDebitsActive
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <CreditCard
              className={cn(
                "h-5 w-5 transition-transform",
                isDebitsActive ? "scale-110 text-primary" : ""
              )}
            />
            {isDebitsActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Despesas</span>
        </Link>

        {/* 2. Receitas */}
        <Link
          href={`${prefix}/dashboard/credits${queryString}`}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors rounded-lg",
            isCreditsActive
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <HandCoins
              className={cn(
                "h-5 w-5 transition-transform",
                isCreditsActive ? "scale-110 text-primary" : ""
              )}
            />
            {isCreditsActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Receitas</span>
        </Link>

        {/* 3. Resumo (Dashboard) */}
        <Link
          href={`${prefix}/dashboard${queryString}`}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors rounded-lg",
            isDashboardActive
              ? "text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <PieChart
              className={cn(
                "h-5 w-5 transition-transform",
                isDashboardActive ? "scale-110 text-primary" : ""
              )}
            />
            {isDashboardActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[11px] leading-none tracking-tight">Resumo</span>
        </Link>

        {/* 4. Mais (Sheet de Gestão) */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-1 transition-colors rounded-lg cursor-pointer",
                isManageActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <MoreHorizontal
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isManageActive ? "scale-110 text-primary" : ""
                  )}
                />
                {isManageActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-[11px] leading-none tracking-tight">Mais</span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl p-4">
            <SheetHeader className="text-left pb-2 border-b border-border/50">
              <SheetTitle className="text-base font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Gestão & Configurações
              </SheetTitle>
              <SheetDescription className="text-xs">
                Acesse todas as áreas de controle da sua caixinha.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 py-3">
              {manageSections.map((section) => (
                <div key={section.title} className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-primary pl-1">
                    {section.title}
                  </span>
                  <div className="grid gap-1">
                    {section.links.map((item) => {
                      const Icon = item.icon
                      const isCurrent = pathname === item.href.split("?")[0]
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={() => setSheetOpen(false)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                            isCurrent
                              ? "bg-primary/10 border-primary/40 text-primary font-medium"
                              : "bg-card hover:bg-accent border-border/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "p-2 rounded-lg shrink-0",
                                isCurrent
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold leading-tight">{item.title}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 4. Seção de Perfil do Usuário e Logoff */}
            {user && (
              <div className="pt-3 border-t border-border/60 mt-1 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground pl-1">
                  Conta & Sessão
                </span>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-9 w-9 rounded-full border border-border/60 shrink-0">
                      <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                      <AvatarFallback className="rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-bold leading-tight text-foreground truncate">
                        {user.name || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setSheetOpen(false)
                      await signOut({ redirectTo: "/sign-in" })
                    }}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 gap-1.5 text-xs font-semibold shrink-0 ml-2 cursor-pointer"
                    aria-label="Sair da conta"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
