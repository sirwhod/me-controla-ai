"use client"

import { Loader } from "@/app/components/ui/loader"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getPaymentMethods } from "@/app/http/payment-methods/get-payment-methods"
import { Bank, PaymentMethod } from "@/app/types/financial"
import { useQuery } from "@tanstack/react-query"
import { columns } from "./columns"
import { DataTable } from "./data-table"
import { getBanks } from "@/app/http/banks/get-banks"
import { useEffect } from "react"
import { redirect } from "next/navigation"

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

  const { data: banks } = useQuery<Bank[], Error>({
      queryKey: ['banks', workspaceActive?.id],
      queryFn: () => getBanks(workspaceActive!.id),
      staleTime: 1000 * 60 * 5,
      enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
    })

  const { data: paymentMethods, isLoading: isPaymentMethodsLoading } = useQuery<PaymentMethod[], Error>({
    queryKey: ['payment-methods', workspaceActive?.id, bankId],
    queryFn: () => getPaymentMethods({workspaceId: workspaceActive!.id, bankId}),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  useEffect(() => {
    if (banks) {
      const bankExistInWorkspace = banks.find((bank) => bank.id === bankId)

      if (!bankExistInWorkspace) {
        redirect('/manage/banks')
      }
    }
  }, [banks])

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