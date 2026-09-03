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
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getCards } from "@/app/http/cards"
import { CreditCard } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "@/app/components/context-link"
import { Button } from "@/app/components/ui/button"
import { CreditCard as CardIcon, Landmark } from "lucide-react"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { CreateCard } from "@/app/components/create-card"
import { EmptyState } from "@/app/components/states/empty-state"
import { PageHeader } from "@/app/components/page-header"

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
          <Link
            href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard`}
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

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto pb-20 md:pb-6">
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
        <PageHeader
          title="Cartões de Crédito"
          description="Cadastre cartões vinculados a bancos para gerenciar limites e datas de vencimento de faturas."
          icon={<CardIcon className="size-5 shrink-0 text-primary md:size-6" aria-hidden="true" />}
          action={<CreateCard className="h-10 w-full font-semibold shadow-xs md:h-9 md:w-auto" />}
        />

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
          ) : !cards?.length ? (
            <EmptyState
              icon={CardIcon}
              title="Nenhum cartão cadastrado"
              description="Cadastre um cartão para acompanhar limites, compras e datas da fatura."
              action={<CreateCard />}
            />
          ) : (
            <DataTable columns={columns} data={cards || []} />
          )}
        </div>
      </div>
    </>
  )
}
