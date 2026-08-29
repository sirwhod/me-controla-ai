"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCredit } from "../http/credits/delete-credit"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"
import type { Credit } from "@/app/types/financial"

interface DeleteCreditProps {
  creditId?: string
  creditDescription?: string
}

export function DeleteCredit({ creditId, creditDescription = "esta receita" }: DeleteCreditProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteCreditFn, isPending } = useMutation({
    mutationFn: () =>
      deleteCredit({
        creditId: creditId || "",
        workspaceId: workspaceActive!.id,
      }),
    onSuccess: (response) => {
      queryClient.setQueriesData<Credit[]>(
        { queryKey: ["credits", workspaceActive?.id] },
        (cached) => cached?.filter((credit) => credit.id !== creditId)
      )
      queryClient.invalidateQueries({ queryKey: ["analytics-summary", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["annual-summary", workspaceActive?.id] })
      toast.success(response.message || "Receita excluída com sucesso!")
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir receita.")
    },
  })

  const handleDeleteCredit = async () => {
    if (!workspaceActive || !creditId) return
    await deleteCreditFn()
  }

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault()
          setOpen(true)
        }}
        className="cursor-pointer gap-2 text-destructive focus:text-destructive text-xs"
      >
        <Trash2 className="h-4 w-4" />
        Excluir receita
      </DropdownMenuItem>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir Receita"
        description={`Tem certeza de que deseja excluir o lançamento de receita "${creditDescription}"? Esta ação recalculará o balanço e não poderá ser desfeita.`}
        confirmText="Excluir Receita"
        isPending={isPending}
        onConfirm={handleDeleteCredit}
      />
    </>
  )
}
