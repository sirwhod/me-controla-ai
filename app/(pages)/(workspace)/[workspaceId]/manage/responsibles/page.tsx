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
import { DataTable } from "./data-table"
import { getColumns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getResponsibles } from "@/app/http/responsibles"
import { PersonResponsible } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Loader } from "@/app/components/ui/loader"
import Link from "next/link"
import { useMemo } from "react"
import { Calendar } from "lucide-react"
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { MonthYearNavigator } from "@/app/components/month-year-navigator"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <Loader size="lg" text="Carregando" />
        <span className="text-muted-foreground text-sm">Carregando responsáveis e receitas...</span>
      </div>
    </div>
  )
}

export default function ResponsiblesPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { month: monthFilter, year: yearFilterNumber } = useDateFilter()
  const yearFilter = String(yearFilterNumber)

  const { data: responsibles, isLoading: isResponsiblesLoading } = useQuery<(PersonResponsible & { pendingBalance: number })[], Error>({
    queryKey: ['responsibles', workspaceActive?.id, monthFilter, yearFilter],
    queryFn: () => getResponsibles(workspaceActive!.id, { month: monthFilter, year: yearFilter }),
    staleTime: 1000 * 60 * 2,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const tableColumns = useMemo(
    () => getColumns(monthFilter, yearFilter),
    [monthFilter, yearFilter]
  )

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
                {isWorkspaceLoading || !workspaceActive ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <WorkspaceSelector />
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Responsáveis
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Filtros de Mês e Ano */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-background p-3 rounded-lg border">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Período de Apuração das Receitas:</span>
          </div>

          <MonthYearNavigator />
        </div>

        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4">
          {isWorkspaceLoading || !workspaceActive || isResponsiblesLoading ? (
            <LoadPage />
          ) : (
            <DataTable columns={tableColumns} data={responsibles || []} />
          )}
        </div>
      </div>
    </>
  )
}
