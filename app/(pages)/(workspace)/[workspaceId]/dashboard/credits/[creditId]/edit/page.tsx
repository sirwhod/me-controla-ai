"use client"

import React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb"
import { Separator } from "@/app/components/ui/separator"
import { SidebarTrigger } from "@/app/components/ui/sidebar"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Logo } from "@/app/components/logo"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getCredit } from "@/app/http/credits/get-credit"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { EditCreditForm } from "./edit-credit-form"

export default function EditCreditPage() {
  const params = useParams()
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()
  const effectiveWorkspaceId = workspaceActive?.id || (params?.workspaceId as string)
  const creditId = params?.creditId as string

  const {
    data: credit,
    isLoading: isCreditLoading,
    error: creditError,
    refetch,
  } = useQuery({
    queryKey: ["credit", effectiveWorkspaceId, creditId],
    queryFn: () => getCredit(effectiveWorkspaceId, creditId),
    enabled: !!effectiveWorkspaceId && !!creditId,
  })

  const isLoading = (isWorkspaceLoading && !workspaceActive) || isCreditLoading

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header com Breadcrumbs e Trigger do Sidebar */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/70 px-3 md:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur-xs sticky top-0 z-20">
        <div className="flex items-center gap-2 w-full">
          <Link
            href={effectiveWorkspaceId ? `/${effectiveWorkspaceId}/dashboard` : "/dashboard"}
            className="flex md:hidden items-center shrink-0"
            aria-label="MeControla.AI"
          >
            <Logo className="h-6 w-6 text-primary" />
          </Link>
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hidden md:flex" />
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
                <BreadcrumbLink asChild>
                  <Link href={`${effectiveWorkspaceId ? `/${effectiveWorkspaceId}` : ""}/dashboard`}>
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`${effectiveWorkspaceId ? `/${effectiveWorkspaceId}` : ""}/dashboard/credits`}>
                    Receitas
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  Editar Receita
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* Conteúdo Principal da Página Dedicada */}
      <main className="flex-1 p-3 md:p-6 pt-3 max-w-4xl w-full mx-auto pb-20 md:pb-8">
        <div className="mb-4">
          <Link href={`${effectiveWorkspaceId ? `/${effectiveWorkspaceId}` : ""}/dashboard/credits`}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground -ml-2 text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para lista de receitas
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-card border border-border/80 rounded-2xl p-6">
            <LoadingState variant="list" count={4} />
          </div>
        ) : creditError || !credit ? (
          <ErrorState
            title="Receita não encontrada"
            message={creditError?.message || "Não foi possível carregar as informações deste lançamento."}
            onRetry={() => refetch()}
          />
        ) : (
          <EditCreditForm credit={credit} />
        )}
      </main>
    </div>
  )
}
