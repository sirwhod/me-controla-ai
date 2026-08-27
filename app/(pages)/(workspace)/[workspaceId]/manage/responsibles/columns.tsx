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
import { CheckCircle2, MoreHorizontal } from "lucide-react"
import { ResponsiblePixModal } from "@/app/components/responsible-pix-modal"
import { EditResponsible } from "@/app/components/edit-responsible"
import { DeleteResponsible } from "@/app/components/delete-responsible"
import { formatCurrency } from "@/app/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"

export function getColumns(month?: string, year?: string): ColumnDef<PersonResponsible & { pendingBalance: number }>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" />,
      cell: ({ row }) => {
        const resp = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-border">
              {resp.userImage && <AvatarImage src={resp.userImage} alt={resp.name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {resp.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <strong className="text-sm font-semibold text-foreground">{resp.name}</strong>
                {resp.isRegisteredUser && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Usuário
                  </Badge>
                )}
              </div>
              {resp.email ? (
                <span className="text-xs text-muted-foreground">{resp.email}</span>
              ) : (
                <span className="text-xs text-muted-foreground italic">Sem e-mail cadastrado</span>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "pendingBalance",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo Devedor (Despesas)" />,
      cell: ({ row }) => {
        const balance = row.original.pendingBalance || 0
        return (
          <div className="font-bold text-sm">
            {balance > 0 ? (
              <div className="flex flex-col">
                <span className="text-red-500 font-extrabold">{formatCurrency(balance)}</span>
                <span className="text-[10px] text-muted-foreground font-normal">A receber</span>
              </div>
            ) : (
              <span className="text-emerald-500 font-semibold">R$ 0,00 (Em dia)</span>
            )}
          </div>
        )
      },
    },
    {
      id: "quick-pix",
      header: "Cobrança PIX",
      cell: ({ row }) => {
        const resp = row.original
        return (
          <ResponsiblePixModal
            responsibleId={resp.id}
            responsibleName={resp.name}
            pendingBalance={resp.pendingBalance || 0}
            month={month}
            year={year}
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
}

export const columns = getColumns()
