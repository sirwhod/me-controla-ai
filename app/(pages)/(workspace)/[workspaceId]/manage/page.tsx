"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import {
  SidebarTrigger,
} from "@/app/components/ui/sidebar"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Card, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Landmark, Tags, Target, ArrowRight, CreditCard, Users, UserCheck } from "lucide-react"
import Link from "next/link"

export default function ManageHubPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()
  const wsId = workspaceActive?.id || ""
  const prefix = wsId ? `/${wsId}` : ""

  const configCards = [
    {
      title: "Bancos e Contas",
      description: "Gerencie contas correntes, logos de bancos, datas de fechamento e chave PIX para cobrança.",
      href: `${prefix}/manage/banks`,
      icon: Landmark,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Cartões de Crédito",
      description: "Cadastre cartões com limites, últimos 4 dígitos, datas de fechamento e banco emissor.",
      href: `${prefix}/manage/cards`,
      icon: CreditCard,
      color: "text-violet-500 bg-violet-500/10",
    },
    {
      title: "Categorias",
      description: "Cadastre categorias para classificar suas despesas e receitas com ícones customizados.",
      href: `${prefix}/manage/categories`,
      icon: Tags,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Metas Financeiras",
      description: "Estabeleça objetivos financeiros com valor alvo e acompanhe o progresso de economia.",
      href: `${prefix}/manage/goals`,
      icon: Target,
      color: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: "Responsáveis",
      description: "Gerencie terceiros vinculados a despesas e gere cobranças PIX automatizadas.",
      href: `${prefix}/manage/responsibles`,
      icon: UserCheck,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Membros & Acesso",
      description: "Gerencie convites e os usuários que possuem permissão de acesso a esta caixinha.",
      href: `${prefix}/manage/members`,
      icon: Users,
      color: "text-sky-500 bg-sky-500/10",
    },
  ]

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-1 md:mr-2 h-4"
          />
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
                  Configurações
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações da Caixinha</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e personalize os parâmetros financeiros do workspace ativo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.title} href={card.href} className="group">
                <Card className="h-full transition-all hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${card.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                    <CardTitle className="text-lg mt-3">{card.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}