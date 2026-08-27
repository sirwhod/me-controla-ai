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
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Landmark, Tags, Target, ArrowRight, CreditCard, Users, UserCheck, Settings } from "lucide-react"
import Link from "next/link"

export default function ManageHubPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()
  const wsId = workspaceActive?.id || ""
  const prefix = wsId ? `/${wsId}` : ""

  const sections = [
    {
      group: "Contas e Pagamentos",
      description: "Instituições bancárias, contas e cartões vinculados à caixinha.",
      items: [
        {
          title: "Bancos e Contas",
          description: "Contas correntes, logos de bancos e chave PIX para cobrança.",
          href: `${prefix}/manage/banks`,
          icon: Landmark,
          color: "text-blue-500 bg-blue-500/10",
        },
        {
          title: "Cartões de Crédito",
          description: "Cartões com limites, últimos 4 dígitos e datas de vencimento.",
          href: `${prefix}/manage/cards`,
          icon: CreditCard,
          color: "text-violet-500 bg-violet-500/10",
        },
      ],
    },
    {
      group: "Organização",
      description: "Classificação de gastos e pessoas responsáveis pelas despesas.",
      items: [
        {
          title: "Categorias",
          description: "Categorias personalizadas para classificar receitas e despesas.",
          href: `${prefix}/manage/categories`,
          icon: Tags,
          color: "text-purple-500 bg-purple-500/10",
        },
        {
          title: "Responsáveis",
          description: "Pessoas vinculadas a despesas com geração de cobrança PIX.",
          href: `${prefix}/manage/responsibles`,
          icon: UserCheck,
          color: "text-amber-500 bg-amber-500/10",
        },
      ],
    },
    {
      group: "Planejamento",
      description: "Metas de economia e objetivos financeiros para o futuro.",
      items: [
        {
          title: "Metas Financeiras",
          description: "Objetivos financeiros com valor alvo e acompanhamento de progresso.",
          href: `${prefix}/manage/goals`,
          icon: Target,
          color: "text-emerald-500 bg-emerald-500/10",
        },
      ],
    },
    {
      group: "Acesso e Segurança",
      description: "Gerenciamento de usuários e permissões da caixinha.",
      items: [
        {
          title: "Membros & Acesso",
          description: "Convites e usuários com permissão de visualização e edição.",
          href: `${prefix}/manage/members`,
          icon: Users,
          color: "text-sky-500 bg-sky-500/10",
        },
      ],
    },
  ]

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
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
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
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

      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl w-full mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-primary" />
            Configurações da Caixinha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Personalize parâmetros financeiros, categorias, contas e o acesso de membros ao workspace ativo.
          </p>
        </div>

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

              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.title} href={item.href} className="group block">
                      <Card className="h-full transition-all border-border/60 bg-card/60 hover:border-primary/60 hover:bg-card hover:shadow-xs">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <div className={`p-2 rounded-lg ${item.color}`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                          </div>
                          <CardTitle className="text-sm sm:text-base mt-2.5 font-bold">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-xs leading-relaxed line-clamp-2 mt-0.5">
                            {item.description}
                          </CardDescription>
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