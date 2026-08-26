"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { deleteCard } from "@/app/http/cards"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"

interface DeleteCardProps {
  cardId: string
  asDropdownItem?: boolean
}

export function DeleteCard({ cardId, asDropdownItem = false }: DeleteCardProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteCardMutation, isPending } = useMutation({
    mutationFn: () => deleteCard(workspaceActive!.id, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", workspaceActive?.id] })
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asDropdownItem ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setOpen(true)
            }}
            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Excluir cartão
          </DropdownMenuItem>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este cartão? O histórico de compras anteriores não será afetado.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="justify-between pt-2">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
