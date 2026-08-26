"use client"

import { useWorkspace } from "@/app/hooks/use-workspace"
import { useQuery } from "@tanstack/react-query"
import { getResponsibles } from "@/app/http/responsibles"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Users2 } from "lucide-react"

export default function ResponsiblesPage() {
  const { workspaceActive, isLoading: isWorkspaceLoading } = useWorkspace()

  const { data: responsibles = [], isLoading } = useQuery({
    queryKey: ["responsibles", workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    enabled: !!workspaceActive && !isWorkspaceLoading,
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users2 className="h-6 w-6 text-primary" />
          Gestão de Responsáveis & Balanço PIX
        </h1>
        <p className="text-sm text-muted-foreground">
          Cadastre pessoas para dividir despesas, acompanhar dívidas em aberto e gerar cobranças automáticas via PIX e WhatsApp.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Carregando responsáveis...
        </div>
      ) : (
        <DataTable columns={columns} data={responsibles} />
      )}
    </div>
  )
}
