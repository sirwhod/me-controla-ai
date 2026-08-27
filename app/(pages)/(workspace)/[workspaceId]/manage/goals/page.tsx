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
import { columns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getGoals } from "@/app/http/goals/get-goals"
import { Goal } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Loader } from "@/app/components/ui/loader"
import Link from "next/link"
import { CreateGoal } from "@/app/components/create-goal"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <Loader size="lg" text="Carregando" />
        <span className="text-muted-foreground text-sm">Carregando metas...</span>
      </div>
    </div>
  )
}

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { data: goals, isLoading: isGoalsLoading } = useQuery<Goal[], Error>({
    queryKey: ['goals', workspaceActive?.id],
    queryFn: () => getGoals(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

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
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard`}>
                  Dashboard
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  Metas
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4 gap-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Metas Financeiras</h2>
              <p className="text-sm text-muted-foreground">
                Defina e acompanhe os objetivos financeiros desta caixinha.
              </p>
            </div>
            <CreateGoal />
          </div>

          {(isWorkspaceLoading || !workspaceActive || isGoalsLoading) ? (
            <LoadPage />
          ) : (
            <DataTable columns={columns} data={goals || []} />
          )}
        </div>
      </div>
    </>
  )
}
