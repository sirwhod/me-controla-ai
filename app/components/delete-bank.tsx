"use client"

import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQuery } from "@tanstack/react-query"
import { deleteBank } from "../http/banks/delete-bank"
import { Bank } from "../types/financial"
import { getBanks } from "../http/banks/get-banks"
import { toast } from "sonner"

interface DeleteBankProps {
  bankId: string
}

export function DeleteBank({ bankId }: DeleteBankProps) {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { mutateAsync: deleteBankFn } = useMutation({
    mutationFn: deleteBank
  })

  const { refetch } = useQuery<Bank[], Error>({
    queryKey: ['banks', workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleDeleteBank() {
    try {
      if (!!workspaceActive && !isWorkspaceLoading && !workspaceError) {
        const response = await deleteBankFn({
          bankId,
          workspaceId: workspaceActive.id
        })

        if (response) {
          refetch()
          toast.success(response.message)
        }
      }

    } catch(error: unknown) {
      toast.error(`
          Erro ao criar novo banco.
          Erro: ${error}
        `)
    }
  }

  return (
    <DropdownMenuItem 
      className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4" 
      onClick={handleDeleteBank}
    >
      <Trash2 className="h-4 w-4" />
      Deletar Banco
    </DropdownMenuItem>
  )
}