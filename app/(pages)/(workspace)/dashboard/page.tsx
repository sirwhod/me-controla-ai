"use client"

import { useWorkspace } from "@/app/hooks/use-workspace"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useEffect } from "react"
import { Loader } from "@/app/components/ui/loader"

export default function DashboardRedirect() {
  const { workspaceActive, isLoading } = useWorkspace()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && workspaceActive?.id) {
      router.replace(`/${workspaceActive.id}/dashboard`)
    }
  }, [workspaceActive, isLoading, router])

  return (
    <div className="flex h-96 w-full flex-col items-center justify-center space-y-4">
      <Loader size="lg" text="Carregando caixinha..." />
      <span className="text-sm text-muted-foreground">Redirecionando para o Dashboard...</span>
    </div>
  )
}
