"use client"

import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Credit } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { Banknote, CreditCard, Landmark, MoreHorizontal, User, Pencil } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import Link from "@/app/components/context-link"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { DeleteCredit } from "@/app/components/delete-credit"

export const columns: ColumnDef<Credit>[] = [
  {
    accessorKey: "responsibleName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Responsável" />,
    cell: ({ row }) => {
      const name = row.original.responsibleName
      if (!name) {
        return <span className="text-xs text-muted-foreground italic">Nenhum</span>
      }

      const initials = name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()

      return (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
            {initials || <User className="h-3.5 w-3.5" />}
          </div>
          <span className="font-medium text-sm text-foreground truncate max-w-[140px]">{name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Data" />,
    cell: ({ row }) => {
      const date = row.original.date
      if (!date) return <span className="text-muted-foreground">-</span>
      const dateFormatted = format(new Date(date), "dd/MM/yyyy")

      return (
        <div className="flex flex-row gap-2 items-center text-sm">
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
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0"
                />
              </TooltipTrigger>
              <TooltipContent>
                <strong>{categoryName || "Categoria"}</strong>
              </TooltipContent>
            </Tooltip>
          )}
          <span className="truncate max-w-[200px]">{description}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "value",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" />,
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("value"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value)

      return (
        <div className="font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
          + {formatted}
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
      const paymentMethod = row.original.paymentMethod

      const getMethodIcon = () => {
        switch (paymentMethod) {
          case "Conta":
            return <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
          case "Crédito":
            return <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
          case "Débito":
            return <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
          case "Pix":
            return (
              <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-muted-foreground">
                <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
              </svg>
            )
          default:
            return null
        }
      }

      return (
        <div className="flex flex-col gap-0.5">
          {/* Linha 1: Banco / Conta */}
          <div className="flex items-center gap-2 font-medium">
            {bankImageUrl ? (
              <Image src={bankImageUrl} alt={bankName || ""} width={18} height={18} className="h-4.5 w-4.5 rounded-sm object-cover" />
            ) : (
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-0.5 rounded-xs">
                <Landmark className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="text-sm">{bankName || "Não vinculado"}</span>
          </div>

          {/* Linha 2: Forma de pagamento */}
          {paymentMethod && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-0.5">
              {getMethodIcon()}
              <span>{paymentMethod}</span>
            </div>
          )}
        </div>
      )
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/${credit.workspaceId}/dashboard/credits/${credit.id}/edit`}
                  className="cursor-pointer flex items-center"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DeleteCredit creditId={credit.id} creditDescription={credit.description} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
