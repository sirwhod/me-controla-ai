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
import { columns } from "./columns"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@/app/http/categories/get-categories"
import { Category } from "@/app/types/financial"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Loader } from "@/app/components/ui/loader"
import Link from "next/link"
import { DataTable } from "./data-table"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div>
          <div
            className="flex flex-col items-center justify-center gap-2 p-4"
          >
            <Loader size="lg" text="Carregando" />
            <span className="text-muted-foreground text-sm">Carregando</span>
          </div>
      </div>
    </div>
  )
}

export default function Page() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[], Error>({
    queryKey: ['categories', workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
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
                  <Link href="#">
                    {isWorkspaceLoading || !workspaceActive  &&  (
                      <Skeleton className="h-5 w-48" />
                    )}
                    {isWorkspaceLoading &&  (
                      <Skeleton className="h-5 w-48" />
                    )}
                    <WorkspaceSelector />
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Bancos
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="hidden md:grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
            <div className="bg-muted/50 aspect-video rounded-xl" />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min p-4">
            {isWorkspaceLoading || !workspaceActive  &&  (
              <LoadPage />
            )}
            {isWorkspaceLoading &&  (
              <LoadPage />
            )}
            {isCategoriesLoading && (
              <LoadPage />
            )}
            {categories && (
              <DataTable columns={columns} data={categories} />
            )}
          </div>
        </div>
    </>
  )
}
