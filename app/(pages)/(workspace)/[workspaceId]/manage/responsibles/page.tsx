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
import { getColumns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getResponsibles } from "@/app/http/responsibles"
import { PersonResponsible } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "@/app/components/context-link"
import { useMemo } from "react"
import { Calendar, Users } from "lucide-react"
import { useParams } from "next/navigation"
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { MonthYearNavigator } from "@/app/components/month-year-navigator"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { CreateResponsible } from "@/app/components/create-responsible"
import { EmptyState } from "@/app/components/states/empty-state"
import { PageHeader } from "@/app/components/page-header"

export default function ResponsiblesPage() {
  const params = useParams()
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)
  const effectiveWorkspaceId = workspaceActive?.id || (params?.workspaceId as string)

  const {
    data: responsibles,
    isLoading: isResponsiblesLoading,
    error: responsiblesError,
    refetch,
  } = useQuery<(PersonResponsible & { pendingBalance: number })[], Error>({
    queryKey: ["responsibles", effectiveWorkspaceId, monthFilter, yearFilter],
    queryFn: () => getResponsibles(effectiveWorkspaceId, {
      month: monthFilter,
      year: yearFilter,
      includeBalances: true,
    }),
    staleTime: 1000 * 60 * 2,
    enabled: !!effectiveWorkspaceId,
  })

  const tableColumns = useMemo(
    () => getColumns(monthFilter, yearFilter),
    [monthFilter, yearFilter]
  )

  const isLoading = (isWorkspaceLoading && !workspaceActive) || (isResponsiblesLoading && !responsibles)
  const error = workspaceError || responsiblesError

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
                  Responsáveis
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        {/* ========================================================================= */}
        {/* 1. ESTRUTURA MOBILE (< 768px): Header + Período + CTA                     */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 md:hidden w-full">
          <PageHeader
            title="Responsáveis"
            description="Acompanhe gastos vinculados a pessoas e gere cobranças PIX."
            icon={<Users className="size-5 shrink-0 text-primary" aria-hidden="true" />}
          />

          {/* Período de Apuração */}
          <MonthYearNavigator
            showFullMonthName
            className="w-full justify-between bg-card/80 border-border/70 h-10 shadow-xs text-xs font-semibold"
          />

          <CreateResponsible fullWidth className="h-10 font-semibold shadow-xs" />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 768px): Header + Período Horizontal              */}
        {/* ========================================================================= */}
        <div className="hidden md:flex flex-col gap-4 w-full">
          <PageHeader
            title="Responsáveis"
            description="Cadastre pessoas, vincule a despesas compartilhadas e acompanhe saldos em aberto."
            icon={<Users className="size-5 shrink-0 text-primary md:size-6" aria-hidden="true" />}
            action={<CreateResponsible className="h-10 w-full font-semibold shadow-xs md:h-9 md:w-auto" />}
          />

          <div className="flex items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/60">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Período de Apuração das Despesas & Saldo:</span>
            </div>

            <MonthYearNavigator showFullMonthName compact />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTAGEM DE DADOS (MOBILE: ResponsibleList / DESKTOP: DataTable)       */}
        {/* ========================================================================= */}
        <div className="w-full">
          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar os responsáveis"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : !responsibles?.length ? (
            <EmptyState
              icon={Users}
              title="Nenhum responsável cadastrado"
              description="Cadastre uma pessoa para dividir despesas e acompanhar valores em aberto."
              action={<CreateResponsible />}
            />
          ) : (
            <DataTable
              columns={tableColumns}
              data={responsibles || []}
              month={monthFilter}
              year={yearFilter}
            />
          )}
        </div>
      </div>
    </>
  )
}
