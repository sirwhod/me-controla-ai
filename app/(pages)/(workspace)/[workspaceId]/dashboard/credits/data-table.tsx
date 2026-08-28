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
import { Credit } from "@/app/types/financial"
import { HandCoins, RotateCcw, Search } from "lucide-react"
import { RevenueList, RevenueListItem } from "./revenue-list"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { CreateCredit } from "@/app/components/create-credit"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export function DataTable<TData extends Credit, TValue>({
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
  const searchValue = (table.getColumn("description")?.getFilterValue() as string) ?? ""
  const isFiltering = Boolean(searchValue || hasActiveFilters)

  const clearAll = () => {
    table.getColumn("description")?.setFilterValue("")
    if (onClearFilters) {
      onClearFilters()
    }
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Campo de Busca Rápida */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar receitas..."
          value={searchValue}
          onChange={(event) =>
            table.getColumn("description")?.setFilterValue(event.target.value)
          }
          className="pl-9 h-10 sm:h-9 text-xs sm:text-sm bg-card/60 border-border/70 w-full"
        />
      </div>

      {/* 1. VISÃO MOBILE (< 768px): RevenueList com Cards Estruturados */}
      <div className="block md:hidden w-full">
        {rows.length ? (
          <RevenueList>
            {rows.map((row) => (
              <RevenueListItem key={row.id} credit={row.original as Credit} />
            ))}
          </RevenueList>
        ) : isFiltering ? (
          <EmptyState
            icon={HandCoins}
            title="Nenhuma receita encontrada"
            description="Não encontramos receitas para os filtros ou busca aplicados."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={HandCoins}
            title="Nenhuma receita cadastrada"
            description="Comece registrando sua primeira receita neste período."
            action={<CreateCredit />}
          />
        )}
      </div>

      {/* 2. VISÃO DESKTOP (>= 768px): Tabela Tradicional Completa */}
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
                  {isFiltering ? (
                    <EmptyState
                      icon={HandCoins}
                      title="Nenhuma receita encontrada"
                      description="Não há lançamentos correspondentes aos filtros ou busca aplicados."
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAll}
                          className="gap-1.5 text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Limpar filtros
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={HandCoins}
                      title="Nenhuma receita cadastrada"
                      description="Não há lançamentos de receitas para o período selecionado."
                      action={<CreateCredit />}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="receita(s) encontrada(s)." />
    </div>
  )
}
