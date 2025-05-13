"use client"

import { DeleteBank } from "@/app/components/delete-bank"
import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Bank } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { Banknote, MoreHorizontal } from "lucide-react"
import Image from "next/image"

export const columns: ColumnDef<Bank>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Banco" />
      )
    },
    cell: ({ row }) => {
      const iconUrl = row.original.iconUrl
      const code = row.original.code
      const name = row.original.name

      return (
        <div className="w-full flex flex-row gap-4 items-center">
          {/* Image */}
          {iconUrl ? (
            <Image src={iconUrl} alt="" width={36} height={36} />
          ) : (
            <div className="bg-orange-500 p-2 rounded-md">
              <Banknote className="text-foreground" />
            </div>
          )}
          <div className="flex flex-col gap-0 items-start justify-self-start">
            <strong>{name}</strong>
            <span>{code}</span>
          </div>
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const bank = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
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
            <DropdownMenuItem>Tipos de Pagamento</DropdownMenuItem>
            <DeleteBank bankId={bank.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
