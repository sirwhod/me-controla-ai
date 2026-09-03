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
import Link from "@/app/components/context-link"
import { CreateGoal } from "@/app/components/create-goal"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { Target } from "lucide-react"
import { EmptyState } from "@/app/components/states/empty-state"
import { PageHeader } from "@/app/components/page-header"

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
        <PageHeader
          title="Metas Financeiras"
          description="Defina objetivos de economia e acompanhe a evolução dos aportes."
          icon={<Target className="size-5 shrink-0 text-primary md:size-6" aria-hidden="true" />}
          action={<CreateGoal label="Nova Meta" className="h-10 w-full font-semibold shadow-xs md:h-9 md:w-auto" />}
        />

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
          ) : !goals?.length ? (
            <EmptyState
              icon={Target}
              title="Nenhuma meta financeira"
              description="Crie uma meta para acompanhar aportes e a evolução de um objetivo."
              action={<CreateGoal label="Nova Meta" />}
            />
          ) : (
            <DataTable columns={columns} data={goals || []} />
          )}
        </div>
      </div>
    </>
  )
}
