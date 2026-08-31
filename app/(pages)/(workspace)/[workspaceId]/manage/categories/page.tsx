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
import { Skeleton } from "@/app/components/ui/skeleton"
import { Logo } from "@/app/components/logo"
import WorkspaceSelector from "@/app/components/workspace-selector"
import { columns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@/app/http/categories/get-categories"
import { Category } from "@/app/types/financial"
import Link from "@/app/components/context-link"
import { DataTable } from "./data-table"
import { LoadingState } from "@/app/components/states/loading-state"
import { ErrorState } from "@/app/components/states/error-state"
import { Tags } from "lucide-react"
import { CreateCategory } from "@/app/components/create-category"
import { EmptyState } from "@/app/components/states/empty-state"

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    error: categoriesError,
    refetch,
  } = useQuery<Category[], Error>({
    queryKey: ["categories", workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const isLoading = isWorkspaceLoading || !workspaceActive || isCategoriesLoading
  const error = workspaceError || categoriesError

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
                  Categorias
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
              <Tags className="h-5 w-5 text-primary" />
              Categorias
            </h1>
            <p className="text-xs text-muted-foreground">
              Classifique e organize seus lançamentos de receitas e despesas.
            </p>
          </div>

          {/* CTA Principal Full Width */}
          <CreateCategory fullWidth className="h-10 font-semibold shadow-xs" label="Nova Categoria" />
        </div>

        {/* ========================================================================= */}
        {/* 2. ESTRUTURA DESKTOP (>= 768px): Header Amplo com CTA à Direita           */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary" />
              Categorias
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie as categorias de receitas e despesas desta caixinha.
            </p>
          </div>

          <CreateCategory label="Nova Categoria" />
        </div>

        {/* ========================================================================= */}
        {/* 3. LISTAGEM DE DADOS (MOBILE: CategoryList / DESKTOP: DataTable)          */}
        {/* ========================================================================= */}
        <div className="w-full">
          {isLoading ? (
            <LoadingState variant="list" count={5} />
          ) : error ? (
            <ErrorState
              title="Não foi possível carregar as categorias"
              message={error.message}
              onRetry={() => refetch()}
            />
          ) : !categories?.length ? (
            <EmptyState
              icon={Tags}
              title="Nenhuma categoria cadastrada"
              description="Crie categorias para organizar e filtrar suas receitas e despesas."
              action={<CreateCategory label="Nova Categoria" />}
            />
          ) : (
            <DataTable columns={columns} data={categories || []} />
          )}
        </div>
      </div>
    </>
  )
}
