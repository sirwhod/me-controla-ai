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
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getCards } from "@/app/http/cards"
import { CreditCard } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { CreditCard as CardIcon, Landmark } from "lucide-react"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { CreateCard } from "@/app/components/create-card"

export default function CardsPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const {
    data: cards,
    isLoading: isCardsLoading,
    error: cardsError,
    refetch,
  } = useQuery<CreditCard[], Error>({
    queryKey: ["cards", workspaceActive?.id],
    queryFn: () => getCards(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const isLoading = isWorkspaceLoading || !workspaceActive || isCardsLoading
  const error = workspaceError || cardsError

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
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  Cartões de Crédito
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto">
        {/* Alternador de abas Bancos / Cartões */}
        <div className="flex items-center gap-2">
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground h-9 text-xs"
            >
              <Landmark className="h-4 w-4" />
              Bancos & Contas
            </Button>
          </Link>
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/cards`}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 font-semibold shadow-xs h-9 text-xs"
            >
              <CardIcon className="h-4 w-4 text-primary" />
              Cartões de Crédito
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 1. ESTRUTURA MOBILE (< 768px): Header + CTA Full Width                    */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 md:hidden w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CardIcon className="h-5 w-5 text-primary" />
              Cartões de Crédito
            </h1>
            <p className="text-xs text-muted-foreground">
              Acompanhe cartões, faturas, limites e datas de fechamento.
            </p>
          </div>

          {/* CTA Principal Full Width */}
          <CreateCard fullWidth className="h-10 font-semibold shadow-xs" />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 768px): Header Amplo com CTA à Direita           */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CardIcon className="h-6 w-6 text-primary" />
              Cartões de Crédito
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Cadastre cartões vinculados a bancos para gerenciar limites e datas de vencimento de faturas.
            </p>
          </div>

          <CreateCard />
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTAGEM DE DADOS (MOBILE: CreditCardList / DESKTOP: DataTable)        */}
        {/* ========================================================================= */}
        <div className="w-full">
          {isLoading ? (
            <LoadingState variant="list" count={3} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar os cartões de crédito"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable columns={columns} data={cards || []} />
          )}
        </div>
      </div>
    </>
  )
}
