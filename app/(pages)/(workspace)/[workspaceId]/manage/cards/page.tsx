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
import { getCards } from "@/app/http/cards"
import { CreditCard } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Loader } from "@/app/components/ui/loader"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { CreditCard as CardIcon, Landmark } from "lucide-react"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div className="flex flex-col items-center justify-center gap-2 p-4">
        <Loader size="lg" text="Carregando" />
        <span className="text-muted-foreground text-sm">Carregando</span>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { data: cards, isLoading: isCardsLoading } = useQuery<CreditCard[], Error>({
    queryKey: ['cards', workspaceActive?.id],
    queryFn: () => getCards(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  return (
    <>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur-md px-3 md:px-4">
        <div className="flex items-center gap-2 w-full">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-1 md:mr-2 h-4"
          />
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
                <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/dashboard`}>
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

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Alternador de abas Bancos / Cartões */}
        <div className="flex items-center gap-2">
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/manage/banks`}>
            <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Landmark className="h-4 w-4" />
              Bancos & Contas
            </Button>
          </Link>
          <Link href={`${workspaceActive?.id ? `/${workspaceActive.id}` : ''}/manage/cards`}>
            <Button variant="secondary" size="sm" className="gap-2 font-medium shadow-xs">
              <CardIcon className="h-4 w-4 text-primary" />
              Cartões de Crédito
            </Button>
          </Link>
        </div>

        <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4">
          {isWorkspaceLoading || !workspaceActive || isCardsLoading ? (
            <LoadPage />
          ) : (
            <DataTable columns={columns} data={cards || []} />
          )}
        </div>
      </div>
    </>
  )
}
