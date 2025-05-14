"use client"

import { Trash2 } from "lucide-react"
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu"
import { useWorkspace } from "../hooks/use-workspace"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PaymentMethod } from "../types/financial"
import { toast } from "sonner"
import { deletePaymentMethod } from "../http/payment-methods/delete-payment-method"
import { getPaymentMethods } from "../http/payment-methods/get-payment-methods"

interface DeletePaymentMethodProps {
  paymentMethodId: string
  bankId: string
}

export function DeletePaymentMethod({ paymentMethodId, bankId }: DeletePaymentMethodProps) {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { mutateAsync: deletePaymentMethodFn } = useMutation({
    mutationFn: deletePaymentMethod
  })

  const { refetch } = useQuery<PaymentMethod[], Error>({
    queryKey: ['PaymentMethods', workspaceActive?.id],
    queryFn: () => getPaymentMethods({workspaceId: workspaceActive!.id, bankId}),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleDeletePaymentMethod() {
    try {
      if (!!workspaceActive && !isWorkspaceLoading && !workspaceError) {
        const response = await deletePaymentMethodFn({
          paymentMethodId,
          workspaceId: workspaceActive.id,
        })

        if (response) {
          refetch()
          toast.success(response.message)
        }
      }

    } catch(error: unknown) {
      toast.error(`
          Erro ao deletar novo Método de pagamento.
          Erro: ${error}
        `)
    }
  }

  return (
    <DropdownMenuItem 
      className="focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4" 
      onClick={handleDeletePaymentMethod}
    >
      <Trash2 className="h-4 w-4" />
      Deletar Método de pagamento
    </DropdownMenuItem>
  )
}