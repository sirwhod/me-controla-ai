"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table"
import { useState } from "react"
import { DataTablePagination } from "@/app/components/table/pagination"
import { MobileList } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { Goal } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { MoreHorizontal, Target } from "lucide-react"
import { GoalContributionDialog } from "@/app/components/goal-contribution-dialog"
import { EditGoal } from "@/app/components/edit-goal"
import { DeleteGoal } from "@/app/components/delete-goal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends Goal, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  const rows = table.getRowModel().rows

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. VISÃO MOBILE (< 768px): GoalCards em MobileList */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const goal = row.original as Goal
              const current = Number(goal.currentAmount) || 0
              const target = Number(goal.targetAmount) || 1
              const percentage = Math.min(100, Math.round((current / target) * 100))
              const isCompleted = current >= target

              const startFormatted = goal.startDate
                ? format(new Date(goal.startDate), "dd/MM/yyyy")
                : "-"
              const endFormatted = goal.endDate
                ? format(new Date(goal.endDate), "dd/MM/yyyy")
                : "Sem prazo"

              return (
                <div
                  key={row.id}
                  className="p-4 flex flex-col gap-3.5 border-b border-border/40 last:border-b-0"
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Target className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-semibold text-foreground truncate">
                            {goal.name}
                          </strong>
                          {isCompleted ? (
                            <Badge className="text-[10px] bg-emerald-500 text-white">
                              Concluída
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/40">
                              Em andamento
                            </Badge>
                          )}
                        </div>
                        {goal.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {goal.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Opções da meta"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(goal.id)}
                        >
                          Copiar ID da meta
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditGoal goal={goal} asDropdownItem />
                        <DeleteGoal goalId={goal.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Barra de Progresso e Valores */}
                  <div className="space-y-1.5 bg-background/50 p-3 rounded-lg border border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        {formatCurrency(current)}{" "}
                        <span className="font-normal text-muted-foreground">
                          de {formatCurrency(target)}
                        </span>
                      </span>
                      <span className="font-bold text-primary">{percentage}%</span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Início: {startFormatted}</span>
                      <span>Alvo: {endFormatted}</span>
                    </div>
                  </div>

                  {/* Ação de Aporte */}
                  <div className="flex justify-end pt-1">
                    <GoalContributionDialog goal={goal} />
                  </div>
                </div>
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={Target}
            title="Nenhuma meta cadastrada"
            description="Defina metas financeiras e acompanhe o progresso de economia da sua caixinha."
          />
        )}
      </div>

      {/* 2. VISÃO DESKTOP (>= 768px): Tabela Tradicional */}
      <div className="hidden md:block rounded-xl border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <EmptyState
                    icon={Target}
                    title="Nenhuma meta financeira cadastrada"
                    description="Crie seu primeiro objetivo financeiro para acompanhar os aportes."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="meta(s) encontrada(s)." />
    </div>
  )
}
