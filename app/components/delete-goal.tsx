"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteGoal } from "../http/goals/delete-goal"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"

interface DeleteGoalProps {
  goalId: string
  goalName?: string
}

export function DeleteGoal({ goalId, goalName = "esta meta" }: DeleteGoalProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteGoalFn, isPending } = useMutation({
    mutationFn: () =>
      deleteGoal({
        goalId,
        workspaceId: workspaceActive!.id,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ["goals", workspaceActive?.id] })
      toast.success(response.message || "Meta excluída com sucesso!")
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir meta.")
    },
  })

  const handleDeleteGoal = async () => {
    if (!workspaceActive) return
    await deleteGoalFn()
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
        Excluir meta
      </DropdownMenuItem>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir Meta Financeira"
        description={`Tem certeza de que deseja excluir a meta "${goalName}"? O histórico de aportes vinculados não poderá ser recuperado.`}
        confirmText="Excluir Meta"
        isPending={isPending}
        onConfirm={handleDeleteGoal}
      />
    </>
  )
}
