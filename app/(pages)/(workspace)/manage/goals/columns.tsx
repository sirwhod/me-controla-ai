"use client"

import { DataTableColumnHeader } from "@/app/components/table/column-header"
import { Goal } from "@/app/types/financial"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Target } from "lucide-react"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { DeleteGoal } from "@/app/components/delete-goal"

export const columns: ColumnDef<Goal>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Meta" />,
    cell: ({ row }) => {
      const name = row.original.name
      const description = row.original.description

      return (
        <div className="flex flex-row gap-3 items-center">
          <div className="bg-primary/10 text-primary p-2 rounded-md">
            <Target className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            {description && (
              <span className="text-xs text-muted-foreground line-clamp-1">{description}</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "targetAmount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor Alvo" />,
    cell: ({ row }) => {
      const targetAmount = row.original.targetAmount
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(targetAmount)

      return <span className="font-semibold">{formatted}</span>
    },
  },
  {
    accessorKey: "currentAmount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Progresso" />,
    cell: ({ row }) => {
      const current = row.original.currentAmount || 0
      const target = row.original.targetAmount || 1
      const percentage = Math.min(100, Math.round((current / target) * 100))

      const formattedCurrent = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(current)

      return (
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <div className="flex justify-between text-xs font-medium">
            <span>{formattedCurrent}</span>
            <span className="text-muted-foreground">{percentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Período" />,
    cell: ({ row }) => {
      const startDate = row.original.startDate
      const endDate = row.original.endDate

      const startFormatted = startDate ? format(new Date(startDate), "dd/MM/yyyy") : "-"
      const endFormatted = endDate ? format(new Date(endDate), "dd/MM/yyyy") : "Sem limite"

      return (
        <div className="flex flex-col text-xs text-muted-foreground">
          <span>Início: {startFormatted}</span>
          <span>Alvo: {endFormatted}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const goal = row.original

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
              <DeleteGoal goalId={goal.id} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
