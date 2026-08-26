"use client"

import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Credit } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { Banknote, CreditCard, Landmark, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { DeleteCredit } from "@/app/components/delete-credit"
import { EditCredit } from "@/app/components/edit-credit"

export const columns: ColumnDef<Credit>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
    cell: ({ row }) => {
      const date = row.original.date
      if (!date) return <span className="text-muted-foreground">-</span>
      const dateFormatted = format(new Date(date), "dd/MM/yyyy")

      return (
        <div className="flex flex-row gap-2 items-center">
          <time>{dateFormatted}</time>
        </div>
      )
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
    cell: ({ row }) => {
      const categoryIcon = row.original.categoryUrl
      const categoryName = row.original.categoryName
      const description = row.original.description

      return (
        <div className="flex flex-row gap-2 items-center font-medium">
          {categoryIcon && (
            <Tooltip>
              <TooltipTrigger>
                <DynamicIcon
                  name={categoryIcon as IconName}
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                />
              </TooltipTrigger>
              <TooltipContent>
                <strong>{categoryName || "Categoria"}</strong>
              </TooltipContent>
            </Tooltip>
          )}
          <span>{description}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
    cell: ({ row }) => {
      const paymentMethod = row.original.paymentMethod
      const value = parseFloat(row.getValue("value"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      const getMethodIcon = () => {
        switch (paymentMethod) {
          case "Conta":
            return <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          case "Crédito":
            return <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          case "Débito":
            return <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          case "Pix":
            return (
              <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-600 dark:text-emerald-400">
                <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
              </svg>
            )
          default:
            return null
        }
      }

      return (
        <div className="flex flex-row gap-2 items-center font-semibold text-emerald-600 dark:text-emerald-400">
          <Tooltip>
            <TooltipTrigger>{getMethodIcon()}</TooltipTrigger>
            <TooltipContent>
              <strong>{paymentMethod || "Não especificado"}</strong>
            </TooltipContent>
          </Tooltip>
          <span>+ {formatted}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "bankName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Banco / Conta" />,
    cell: ({ row }) => {
      const bankName = row.original.bankName
      const bankImageUrl = row.original.bankImageUrl

      if (!bankName) return <span className="text-muted-foreground">-</span>

      return (
        <div className="flex flex-row gap-2 items-center">
          {bankImageUrl ? (
            <Image src={bankImageUrl} alt={bankName} width={20} height={20} className="h-5 w-5 rounded-sm" />
          ) : (
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1 rounded-xs">
              <Landmark className="h-3.5 w-3.5" />
            </div>
          )}
          <span>{bankName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Forma" />,
    cell: ({ row }) => {
      const method = row.original.paymentMethod
      return <span>{method || "-"}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const credit = row.original

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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(credit.id)}>
                Copiar ID da receita
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <EditCredit credit={credit} asDropdownItem />
              <DeleteCredit creditId={credit.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
