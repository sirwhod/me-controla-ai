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
import { getColumns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getResponsibles } from "@/app/http/responsibles"
import { PersonResponsible } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { useMemo } from "react"
import { Calendar } from "lucide-react"
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { MonthYearNavigator } from "@/app/components/month-year-navigator"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"

export default function ResponsiblesPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)

  const {
    data: responsibles,
    isLoading: isResponsiblesLoading,
    error: responsiblesError,
    refetch,
  } = useQuery<(PersonResponsible & { pendingBalance: number })[], Error>({
    queryKey: ["responsibles", workspaceActive?.id, monthFilter, yearFilter],
    queryFn: () => getResponsibles(workspaceActive!.id, { month: monthFilter, year: yearFilter }),
    staleTime: 1000 * 60 * 2,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const tableColumns = useMemo(
    () => getColumns(monthFilter, yearFilter),
    [monthFilter, yearFilter]
  )

  const isLoading = isWorkspaceLoading || !workspaceActive || isResponsiblesLoading
  const error = workspaceError || responsiblesError

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
                  Responsáveis
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 pt-3">
        {/* Filtros de Mês e Ano de Apuração */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-xl border border-border/60">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Período de Apuração das Despesas & Saldo:</span>
          </div>

          <MonthYearNavigator showFullMonthName compact />
        </div>

        <div className="bg-muted/40 min-h-[calc(100vh-5rem)] md:min-h-min flex-1 rounded-xl p-3 md:p-4">
          {isLoading ? (
            <LoadingState variant="list" count={5} />
          ) : error ? (
            <ErrorState
              title="Erro ao carregar responsáveis"
              message={error.message}
              onRetry={() => refetch()}
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
