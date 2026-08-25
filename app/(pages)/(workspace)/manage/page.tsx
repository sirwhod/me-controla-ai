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
import { Landmark, Tags, Target, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()

  const configCards = [
    {
      title: "Bancos e Contas",
      description: "Gerencie instituições bancárias, cartões, logos e datas de fechamento/vencimento de fatura.",
      href: "/manage/banks",
      icon: Landmark,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Categorias",
      description: "Cadastre categorias para classificar suas despesas e receitas com ícones customizados.",
      href: "/manage/categories",
      icon: Tags,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Metas Financeiras",
      description: "Estabeleça objetivos financeiros com valor alvo e acompanhe o progresso de economia.",
      href: "/manage/goals",
      icon: Target,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ]

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isWorkspaceLoading || !workspaceActive ? (
                    <Skeleton className="h-5 w-48" />
                  ) : (
                    <WorkspaceSelector />
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <Link href="/dashboard">
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
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

        <div className="grid gap-4 md:grid-cols-3">
          {configCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href} className="group">
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