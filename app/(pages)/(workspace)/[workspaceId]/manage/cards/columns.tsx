"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CreditCard } from "@/app/types/financial"
import { CreditCard as CardIcon, MoreHorizontal, Landmark } from "lucide-react"
import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { EditCard } from "@/app/components/edit-card"
import { DeleteCard } from "@/app/components/delete-card"
import { formatCurrency } from "@/app/lib/utils"

export const columns: ColumnDef<CreditCard>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cartão" />,
    cell: ({ row }) => {
      const card = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2 rounded-md">
            <CardIcon className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{card.name}</span>
            {card.last4Digits && (
              <span className="text-xs text-muted-foreground">•••• {card.last4Digits}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Banco Emissor" />,
    cell: ({ row }) => {
      const bankName = row.original.bankName
      return (
        <div className="flex items-center gap-2 text-sm">
          <Landmark className="h-4 w-4 text-muted-foreground" />
          <span>{bankName || "Não especificado"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "closingDay",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fechamento / Vencimento" />,
    cell: ({ row }) => {
      const closingDay = row.original.closingDay
      const dueDay = row.original.dueDay
      return (
        <div className="flex flex-col text-xs text-muted-foreground gap-0.5">
          <span>Fechamento: <strong className="text-foreground">Dia {closingDay}</strong></span>
          <span>Vencimento: <strong className="text-foreground">Dia {dueDay}</strong></span>
        </div>
      )
    },
  },
  {
    accessorKey: "limit",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Limite Total" />,
    cell: ({ row }) => {
      const limit = row.original.limit
      return (
        <div className="font-medium">
          {limit ? formatCurrency(limit) : <span className="text-muted-foreground text-xs">Sem limite cadastrado</span>}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const card = row.original

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(card.id)}>
                Copiar ID do cartão
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <EditCard card={card} asDropdownItem />
              <DeleteCard cardId={card.id} asDropdownItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
