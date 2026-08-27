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
import { Input } from "@/app/components/ui/input"
import { DataTablePagination } from "@/app/components/table/pagination"
import { CreateResponsible } from "@/app/components/create-responsible"
import { EmptyState } from "@/app/components/states/empty-state"
import { PersonResponsible } from "@/app/types/financial"
import { RotateCcw, Search, Users } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { ResponsibleList, ResponsibleListItem } from "./responsible-list"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  month?: string
  year?: string
}

export function DataTable<
  TData extends PersonResponsible & { pendingBalance: number },
  TValue,
>({ columns, data, month, year }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [balanceStatusFilter, setBalanceStatusFilter] = useState<"all" | "pending" | "settled">("all")

  // Filtro adicional de status de saldo
  const filteredData = data.filter((item) => {
    if (balanceStatusFilter === "pending") return (item.pendingBalance || 0) > 0
    if (balanceStatusFilter === "settled") return (item.pendingBalance || 0) <= 0
    return true
  })

  const table = useReactTable({
    data: filteredData,
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
  const searchValue = (table.getColumn("name")?.getFilterValue() as string) ?? ""
  const isFiltering = Boolean(searchValue || balanceStatusFilter !== "all")

  const clearAllFilters = () => {
    setBalanceStatusFilter("all")
    table.getColumn("name")?.setFilterValue("")
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Barra de Busca + Tabs de Filtro de Saldo + Botão Novo Responsável */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Input de Busca Full Width no Mobile */}
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar responsável por nome..."
            value={searchValue}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-9 h-10 sm:h-9 text-xs sm:text-sm bg-card/60 border-border/70 w-full"
          />
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
          {/* Quick Filter Tabs */}
          <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-card/60 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setBalanceStatusFilter("all")}
              className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors text-center ${
                balanceStatusFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setBalanceStatusFilter("pending")}
              className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors text-center ${
                balanceStatusFilter === "pending"
                  ? "bg-rose-500 text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              A receber
            </button>
            <button
              type="button"
              onClick={() => setBalanceStatusFilter("settled")}
              className={`flex-1 sm:flex-none px-3 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors text-center ${
                balanceStatusFilter === "settled"
                  ? "bg-emerald-500 text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Em dia
            </button>
          </div>

          <div className="hidden sm:block">
            <CreateResponsible />
          </div>
        </div>
      </div>

      {/* 1. VISÃO MOBILE (< 768px): ResponsibleList com Cards Estruturados */}
      <div className="block md:hidden w-full">
        {rows.length ? (
          <ResponsibleList>
            {rows.map((row) => (
              <ResponsibleListItem
                key={row.id}
                resp={row.original as PersonResponsible & { pendingBalance: number }}
                month={month}
                year={year}
              />
            ))}
          </ResponsibleList>
        ) : isFiltering ? (
          <EmptyState
            icon={Users}
            title="Nenhum responsável encontrado"
            description="Não encontramos responsáveis com os filtros de busca ou saldo aplicados."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar busca e filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhum responsável cadastrado"
            description="Cadastre pessoas para vincular a despesas compartilhadas e gerar cobranças automáticas via PIX."
            action={<CreateResponsible />}
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
                      icon={Users}
                      title="Nenhum responsável encontrado"
                      description="Não há responsáveis correspondentes à busca ou ao filtro de saldo."
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                          className="gap-1.5 text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Limpar busca e filtros
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="Nenhum responsável cadastrado"
                      description="Cadastre o primeiro responsável para começar a acompanhar despesas e saldos."
                      action={<CreateResponsible />}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="responsável(is) encontrado(s)." />
    </div>
  )
}
