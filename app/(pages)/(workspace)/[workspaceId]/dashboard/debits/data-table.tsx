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
import { EmptyState } from "@/app/components/states/empty-state"
import { Debit } from "@/app/types/financial"
import { Receipt, RotateCcw } from "lucide-react"
import { ExpenseList, ExpenseListItem } from "./expense-list"
import { Button } from "@/app/components/ui/button"
import { CreateDebit } from "@/app/components/create-debit"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function DataTable<TData extends Debit, TValue>({
  columns,
  data,
  hasActiveFilters = false,
  onClearFilters,
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
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* 1. VISÃO MOBILE/TABLET (< 1024px): ExpenseList com Cards Estruturados */}
      <div className="block w-full lg:hidden">
        {rows.length ? (
          <ExpenseList>
            {rows.map((row) => (
              <ExpenseListItem key={row.id} debit={row.original as Debit} />
            ))}
          </ExpenseList>
        ) : hasActiveFilters ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa encontrada"
            description="Não encontramos despesas para os filtros selecionados."
            action={
              onClearFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa cadastrada"
            description="Comece registrando sua primeira despesa neste período."
            action={<CreateDebit />}
          />
        )}
      </div>

      {/* 2. VISÃO DESKTOP (>= 1024px): Tabela Tradicional Completa */}
      <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-border/60 bg-card lg:block">
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
                  {hasActiveFilters ? (
                    <EmptyState
                      icon={Receipt}
                      title="Nenhuma despesa encontrada"
                      description="Não há lançamentos correspondentes aos filtros aplicados."
                      action={
                        onClearFilters ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                            className="gap-1.5 text-xs"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Limpar filtros
                          </Button>
                        ) : undefined
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Receipt}
                      title="Nenhuma despesa cadastrada"
                      description="Não há lançamentos de despesas para o período selecionado."
                      action={<CreateDebit />}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="despesa(s) encontrada(s)." />
    </div>
  )
}
