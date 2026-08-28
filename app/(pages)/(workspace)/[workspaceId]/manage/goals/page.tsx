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
import { getGoals } from "@/app/http/goals/get-goals"
import { Goal } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { CreateGoal } from "@/app/components/create-goal"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { Target } from "lucide-react"

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const {
    data: goals,
    isLoading: isGoalsLoading,
    error: goalsError,
    refetch,
  } = useQuery<Goal[], Error>({
    queryKey: ["goals", workspaceActive?.id],
    queryFn: () => getGoals(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const isLoading = isWorkspaceLoading || !workspaceActive || isGoalsLoading
  const error = workspaceError || goalsError

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
                  Metas
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-6 pt-3 max-w-7xl w-full mx-auto pb-20 md:pb-6">
        {/* ========================================================================= */}
        {/* 1. ESTRUTURA MOBILE (< 768px): Header + CTA Full Width                    */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-3 md:hidden w-full">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Metas Financeiras
            </h1>
            <p className="text-xs text-muted-foreground">
              Defina objetivos de economia e acompanhe os aportes desta caixinha.
            </p>
          </div>

          {/* CTA Principal Full Width */}
          <CreateGoal fullWidth className="h-10 font-semibold shadow-xs" label="Nova Meta" />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 768px): Header Amplo com CTA à Direita           */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Metas Financeiras
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Defina objetivos de economia e acompanhe a evolução dos aportes.
            </p>
          </div>

          <CreateGoal label="Nova Meta" />
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTAGEM DE DADOS (MOBILE: GoalList / DESKTOP: DataTable)              */}
        {/* ========================================================================= */}
        <div className="w-full">
          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar as metas"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable columns={columns} data={goals || []} />
          )}
        </div>
      </div>
    </>
  )
}
