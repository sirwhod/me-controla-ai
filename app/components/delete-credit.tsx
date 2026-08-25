"use client"

import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQuery } from "@tanstack/react-query"
import { deleteCredit } from "../http/credits/delete-credit"
import { Credit } from "../types/financial"
import { getCredits } from "../http/credits/get-credits"
import { toast } from "sonner"

interface DeleteCreditProps {
  creditId: string
}

export function DeleteCredit({ creditId }: DeleteCreditProps) {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { mutateAsync: deleteCreditFn } = useMutation({
    mutationFn: deleteCredit,
  })

  const { refetch } = useQuery<Credit[], Error>({
    queryKey: ['credits', workspaceActive?.id],
    queryFn: () => getCredits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleDeleteCredit() {
    try {
      if (!!workspaceActive && !isWorkspaceLoading && !workspaceError) {
        const response = await deleteCreditFn({
          creditId,
          workspaceId: workspaceActive.id,
        })

        if (response) {
          refetch()
          toast.success(response.message || "Receita excluída com sucesso!")
        }
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Erro ao excluir receita."
      toast.error(`Erro ao excluir receita: ${errMessage}`)
    }
  }

  return (
    <DropdownMenuItem
      className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      onClick={handleDeleteCredit}
    >
      <Trash2 className="h-4 w-4" />
      Deletar Receita
    </DropdownMenuItem>
  )
}
