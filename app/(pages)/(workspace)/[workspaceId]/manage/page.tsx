"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import { Logo } from "@/app/components/logo"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import {
  Landmark,
  Tags,
  Target,
  CreditCard,
  Users,
  UserCheck,
  Settings,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "@/app/components/context-link"
import { PageHeader } from "@/app/components/page-header"
import { NotificationPreferences } from "@/app/components/notification-preferences"

export default function ManageHubPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()
  const wsId = workspaceActive?.id || ""
  const prefix = wsId ? `/${wsId}` : ""

  const sections = [
    {
      group: "Gestão de Acesso & Pessoas",
      description: "Gerencie permissões de membros e pessoas vinculadas a rateios.",
      items: [
        {
          title: "Membros & Acesso",
          description: "Convites, proprietário e usuários autorizados nesta caixinha.",
          href: `${prefix}/manage/members`,
          icon: Users,
          color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
        },
        {
          title: "Responsáveis",
          description: "Pessoas vinculadas a despesas com geração de cobrança PIX.",
          href: `${prefix}/manage/responsibles`,
          icon: UserCheck,
          color: "text-warning bg-warning/10 border-warning/20",
        },
      ],
    },
    {
      group: "Estrutura Financeira",
      description: "Instituições bancárias, cartões, categorias e objetivos de economia.",
      items: [
        {
          title: "Bancos e Contas",
          description: "Contas correntes, logos de bancos e chave PIX para cobrança.",
          href: `${prefix}/manage/banks`,
          icon: Landmark,
          color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        },
        {
          title: "Cartões de Crédito",
          description: "Cartões com limites, últimos 4 dígitos e datas de vencimento.",
          href: `${prefix}/manage/cards`,
          icon: CreditCard,
          color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
        },
        {
          title: "Categorias",
          description: "Categorias personalizadas para classificar receitas e despesas.",
          href: `${prefix}/manage/categories`,
          icon: Tags,
          color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
        },
        {
          title: "Metas Financeiras",
          description: "Objetivos financeiros com valor alvo e acompanhamento de progresso.",
          href: `${prefix}/manage/goals`,
          icon: Target,
          color: "text-success bg-success/10 border-success/20",
        },
      ],
    },
  ]

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <Link
            href={`${prefix}/dashboard`}
            className="flex items-center shrink-0 lg:hidden"
            aria-label="MeControla.AI"
          >
            <Logo className="h-6 w-6 text-primary" />
          </Link>
          <SidebarTrigger className="-ml-1 hidden text-muted-foreground hover:text-foreground lg:flex" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList className="text-xs sm:text-sm">
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isWorkspaceLoading || !workspaceActive ? (
                    <Skeleton className="h-5 w-32 md:w-48" />
                  ) : (
                    <WorkspaceSelector />
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden lg:block" />
              <BreadcrumbItem className="hidden lg:block">
                <Link href={`${prefix}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  Gestão & Configurações
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-5 p-3 pt-3 pb-20 md:p-6 md:pt-3 lg:pb-6">
        <PageHeader
          title="Gestão da Caixinha"
          description="Gerencie acessos, parâmetros financeiros, contas e metas da caixinha ativa."
          icon={<Settings className="size-5 shrink-0 text-primary md:size-6" aria-hidden="true" />}
        />

        {/* Card de Identificação da Caixinha Ativa */}
        <Card className="border-border/70 bg-card/80 backdrop-blur-xs p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-foreground truncate">
                    {workspaceActive?.name || "Caixinha"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {workspaceActive?.type === "shared" ? "Compartilhada" : "Pessoal"}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success inline" />
                  Workspace ativo e protegido
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-border/70 bg-card/80 p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Notificações neste dispositivo</h2>
              <p className="text-xs text-muted-foreground">Receba avisos importantes da sua caixinha mesmo quando o aplicativo estiver fechado.</p>
            </div>
            <NotificationPreferences />
          </div>
        </Card>

        {/* Grupos Semânticos de Configuração */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.group} className="space-y-3">
              <div className="border-b border-border/40 pb-1.5">
                <h2 className="text-xs uppercase tracking-wider font-bold text-primary">
                  {section.group}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {section.description}
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.title} href={item.href} className="group block">
                      <Card className="h-full transition-all border-border/60 bg-card/60 hover:border-primary/50 hover:bg-card/90 hover:shadow-xs">
                        <CardHeader className="p-3.5 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`p-2 rounded-xl shrink-0 border shadow-2xs ${item.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <CardTitle className="text-sm sm:text-base font-semibold text-foreground truncate">
                                  {item.title}
                                </CardTitle>
                                <CardDescription className="text-xs leading-relaxed line-clamp-1 mt-0.5">
                                  {item.description}
                                </CardDescription>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary shrink-0" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
