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
import { getBanks } from "@/app/http/banks/get-banks"
import { Bank } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { CreditCard as CardIcon, Landmark } from "lucide-react"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const {
    data: banks,
    isLoading: isBanksLoading,
    error: banksError,
    refetch,
  } = useQuery<Bank[], Error>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const isLoading = isWorkspaceLoading || !workspaceActive || isBanksLoading
  const error = workspaceError || banksError

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
                  Bancos
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-3 md:p-4 pt-3">
        {/* Alternador de abas Bancos / Cartões */}
        <div className="flex items-center gap-2">
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`}>
            <Button variant="secondary" size="sm" className="gap-2 font-semibold shadow-xs h-9">
              <Landmark className="h-4 w-4 text-primary" />
              Bancos & Contas
            </Button>
          </Link>
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/cards`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground h-9"
            >
              <CardIcon className="h-4 w-4" />
              Cartões de Crédito
            </Button>
          </Link>
        </div>

        <div className="bg-muted/40 min-h-[calc(100vh-5rem)] md:min-h-min flex-1 rounded-xl p-3 md:p-4">
          {isLoading ? (
            <LoadingState variant="list" count={4} />
          ) : error ? (
            <ErrorState
              title="Erro ao carregar bancos"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable columns={columns} data={banks || []} />
          )}
        </div>
      </div>
    </>
  )
}
