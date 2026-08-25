"use client"

import { DeleteBank } from "@/app/components/delete-bank"
import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Bank } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { CalendarClock, CreditCard, Landmark, MoreHorizontal } from "lucide-react"
import Image from "next/image"

export const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Banco" />,
    cell: ({ row }) => {
      const iconUrl = row.original.iconUrl
      const code = row.original.code
      const name = row.original.name

      return (
        <div className="w-full flex flex-row gap-3 items-center">
          {iconUrl ? (
            <Image src={iconUrl} alt={name} width={36} height={36} className="h-9 w-9 rounded-md object-contain border bg-background p-0.5" />
          ) : (
            <div className="bg-primary/10 text-primary p-2 rounded-md">
              <Landmark className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <strong className="font-medium text-sm">{name}</strong>
            {code && <span className="text-xs text-muted-foreground">Código: {code}</span>}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "invoiceClosingDay",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fechamento Fatura" />,
    cell: ({ row }) => {
      const day = row.original.invoiceClosingDay
      if (!day || day === "0") {
        return <span className="text-xs text-muted-foreground">Não definido</span>
      }

      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400">
          <CreditCard className="h-3.5 w-3.5" />
          <span>Dia {day}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "invoiceDueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Vencimento Fatura" />,
    cell: ({ row }) => {
      const day = row.original.invoiceDueDate
      if (!day || day === "0") {
        return <span className="text-xs text-muted-foreground">Não definido</span>
      }

      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Dia {day}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bank = row.original

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(bank.id)}
              >
                Copiar ID do banco
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteBank bankId={bank.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
