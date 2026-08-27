"use client"

import { DeleteBank } from "@/app/components/delete-bank"
import { EditBank } from "@/app/components/edit-bank"
import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Bank } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { CreditCard, Landmark, MoreHorizontal, QrCode } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Banco / Conta" />,
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
    accessorKey: "pixKey",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chave PIX" />,
    cell: ({ row }) => {
      const pixKey = row.original.pixKey
      const pixKeyType = row.original.pixKeyType

      if (!pixKey) {
        return <span className="text-xs text-muted-foreground italic">Não cadastrada</span>
      }

      return (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <QrCode className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono font-medium truncate max-w-[180px]">{pixKey}</span>
            {pixKeyType && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {pixKeyType}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "cardsCount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cartões Associados" />,
    cell: ({ row }) => {
      const count = row.original.cardsCount || 0
      const workspaceId = row.original.workspaceId

      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary px-2.5 py-1 rounded-full border">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span>
              {count === 0 ? "Nenhum cartão" : count === 1 ? "1 cartão" : `${count} cartões`}
            </span>
          </div>

          {workspaceId && count > 0 && (
            <Link
              href={`/${workspaceId}/manage/cards`}
              className="text-xs text-primary hover:underline"
            >
              Ver cartões
            </Link>
          )}
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
              <EditBank bank={bank} asDropdownItem />
              <DeleteBank bankId={bank.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
