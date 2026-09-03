"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteBank } from "../http/banks/delete-bank"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"
import { Button } from "./ui/button"

interface DeleteBankProps {
  bankId: string
  bankName?: string
  asDropdownItem?: boolean
}

export function DeleteBank({
  bankId,
  bankName = "este banco/conta",
  asDropdownItem = true,
}: DeleteBankProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteBankFn, isPending } = useMutation({
    mutationFn: () =>
      deleteBank({
        bankId,
        workspaceId: workspaceActive!.id,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] })
      toast.success(response.message || "Banco excluído com sucesso!")
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir banco.")
    },
  })

  const handleDeleteBank = async () => {
    if (!workspaceActive || !bankId) return
    await deleteBankFn()
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
          Excluir banco
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
        title="Excluir Banco / Conta"
        description={`Tem certeza de que deseja excluir "${bankName}"? As transações existentes não serão apagadas, mas o vínculo bancário será removido.`}
        confirmText="Excluir Banco"
        isPending={isPending}
        onConfirm={handleDeleteBank}
      />
    </>
  )
}
