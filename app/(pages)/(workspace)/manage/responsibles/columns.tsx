"use client"

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
import { PersonResponsible } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ResponsiblePixModal } from "@/app/components/responsible-pix-modal"
import { EditResponsible } from "@/app/components/edit-responsible"
import { DeleteResponsible } from "@/app/components/delete-responsible"
import { formatCurrency } from "@/app/lib/utils"

export const columns: ColumnDef<PersonResponsible & { pendingBalance: number }>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" />,
    cell: ({ row }) => {
      const resp = row.original
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
            {resp.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong className="text-sm font-semibold text-foreground">{resp.name}</strong>
            {resp.email && <span className="block text-xs text-muted-foreground">{resp.email}</span>}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "pixKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chave PIX" />,
    cell: ({ row }) => {
      const key = row.original.pixKey
      const type = row.original.pixKeyType
      if (!key) return <span className="text-xs text-muted-foreground">Não cadastrada</span>
      return (
        <div className="flex items-center gap-1 text-xs">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-bold text-muted-foreground">
            {type || "PIX"}
          </span>
          <span className="font-mono text-foreground truncate max-w-[140px]">{key}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "pendingBalance",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo Devedor (Aberto)" />,
    cell: ({ row }) => {
      const balance = row.original.pendingBalance || 0
      return (
        <div className="font-bold text-sm">
          {balance > 0 ? (
            <span className="text-red-500 font-extrabold">{formatCurrency(balance)}</span>
          ) : (
            <span className="text-emerald-500 font-semibold">R$ 0,00 (Em dia)</span>
          )}
        </div>
      )
    },
  },
  {
    id: "quick-pix",
    header: "Cobrança",
    cell: ({ row }) => {
      const resp = row.original
      return (
        <ResponsiblePixModal
          responsibleId={resp.id}
          responsibleName={resp.name}
          pendingBalance={resp.pendingBalance || 0}
        />
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const resp = row.original
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(resp.id)}>
                Copiar ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <EditResponsible responsible={resp} asDropdownItem />
              <DeleteResponsible responsibleId={resp.id} responsibleName={resp.name} asDropdownItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
