"use client"

import { DeleteCategory } from "@/app/components/delete-category"
import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Button } from "@/app/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Category } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { DynamicIcon, IconName } from "lucide-react/dynamic"

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <DataTableColumnHeader column={column} title="Categoria" />
      )
    },
    cell: ({ row }) => {
      const icon = row.original.icon as IconName
      const name = row.original.name

      return (
        <div className="w-full flex flex-row gap-2 items-center">
          {/* Image */}
          <DynamicIcon
            name={icon}
            size={16}
          />
          <div className="flex flex-col gap-0 items-start justify-self-start">
            <strong>{name}</strong>
          </div>
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original
 
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
              onClick={() => navigator.clipboard.writeText(category.id)}
            >
              Copiar ID da categoria
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteCategory categoryId={category.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
