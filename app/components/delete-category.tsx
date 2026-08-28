"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteCategory } from "../http/categories/delete-category"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/app/components/ui/confirmation-dialog"

interface DeleteCategoryProps {
  categoryId: string
  categoryName?: string
}

export function DeleteCategory({ categoryId, categoryName = "esta categoria" }: DeleteCategoryProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteCategoryFn, isPending } = useMutation({
    mutationFn: () =>
      deleteCategory({
        categoryId,
        workspaceId: workspaceActive!.id,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive?.id] })
      toast.success(response.message || "Categoria excluída com sucesso!")
      setOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir categoria.")
    },
  })

  const handleDeleteCategory = async () => {
    if (!workspaceActive) return
    await deleteCategoryFn()
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
        Excluir categoria
      </DropdownMenuItem>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir Categoria"
        description={`Tem certeza de que deseja excluir a categoria "${categoryName}"? O histórico de lançamentos anteriores vinculados não será apagado.`}
        confirmText="Excluir Categoria"
        isPending={isPending}
        onConfirm={handleDeleteCategory}
      />
    </>
  )
}