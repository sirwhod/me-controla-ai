"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import { deleteResponsible } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"

interface DeleteResponsibleProps {
  responsibleId: string
  responsibleName: string
  asDropdownItem?: boolean
}

export function DeleteResponsible({
  responsibleId,
  responsibleName,
  asDropdownItem = false,
}: DeleteResponsibleProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteResponsibleMutation, isPending } = useMutation({
    mutationFn: () => deleteResponsible(workspaceActive!.id, responsibleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      toast.success("Responsável excluído com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir responsável.")
    },
  })

  const handleDelete = async () => {
    if (!workspaceActive) return
    await deleteResponsibleMutation()
  }

  return (
    <>
      {asDropdownItem ? (
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            setOpen(true)
          }}
          className="cursor-pointer gap-2 text-destructive focus:text-destructive text-xs"
        >
          <Trash2 className="h-4 w-4" />
          Excluir responsável
        </DropdownMenuItem>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5 text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      )}

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir Responsável"
        description={`Tem certeza de que deseja remover ${responsibleName}? Suas despesas associadas permanecerão no sistema sem vínculo de responsável.`}
        confirmText="Excluir Responsável"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}
