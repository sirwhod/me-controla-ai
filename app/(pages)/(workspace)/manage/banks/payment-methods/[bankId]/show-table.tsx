"use client"

import { Loader } from "@/app/components/ui/loader"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getPaymentMethods } from "@/app/http/payment-methods/get-payment-methods"
import { PaymentMethod } from "@/app/types/financial"
import { useQuery } from "@tanstack/react-query"
import { columns } from "./columns"
import { DataTable } from "./data-table"

function LoadPage() {
  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 p-4 h-96">
      <div>
          <div
            className="flex flex-col items-center justify-center gap-2 p-4"
          >
            <Loader size="lg" text="Carregando" />
            <span className="text-muted-foreground text-sm">Carregando</span>
          </div>
      </div>
    </div>
  )
}

interface ShowTableProps {
  bankId: string
}

export function ShowTable({ bankId } : ShowTableProps) {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const { data: paymentMethods, isLoading: isPaymentMethodsLoading } = useQuery<PaymentMethod[], Error>({
    queryKey: ['payment-methods', workspaceActive?.id, bankId],
    queryFn: () => getPaymentMethods({workspaceId: workspaceActive!.id, bankId}),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  return (
    <>
      {isWorkspaceLoading || !workspaceActive  &&  (
        <LoadPage />
      )}
      {isWorkspaceLoading &&  (
        <LoadPage />
      )}
      {isPaymentMethodsLoading && (
        <LoadPage />
      )}
      {paymentMethods && (
        <DataTable columns={columns} data={paymentMethods} bankId={bankId} />
      )}
    </>
  )
}