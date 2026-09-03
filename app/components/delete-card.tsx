"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import { deleteCard } from "@/app/http/cards"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"

interface DeleteCardProps {
  cardId: string
  cardName?: string
  asDropdownItem?: boolean
}

export function DeleteCard({
  cardId,
  cardName = "este cartão",
  asDropdownItem = false,
}: DeleteCardProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteCardMutation, isPending } = useMutation({
    mutationFn: () => deleteCard(workspaceActive!.id, cardId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cards", workspaceActive?.id] })
      toast.success("Cartão excluído com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao excluir cartão.")
    },
  })

  const handleDelete = async () => {
    if (!workspaceActive) return
    await deleteCardMutation()
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
          Excluir cartão
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
        title="Excluir Cartão de Crédito"
        description={`Tem certeza de que deseja excluir "${cardName}"? O histórico de compras e faturas anteriores não será afetado.`}
        confirmText="Excluir Cartão"
        isPending={isPending}
        onConfirm={handleDelete}
      />
    </>
  )
}
