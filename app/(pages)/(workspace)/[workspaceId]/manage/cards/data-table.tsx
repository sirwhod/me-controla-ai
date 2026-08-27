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
import { CreateCard } from "@/app/components/create-card"
import { EmptyState } from "@/app/components/states/empty-state"
import { CreditCard } from "@/app/types/financial"
import { CreditCard as CardIcon, RotateCcw, Search } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { CreditCardList, CreditCardListItem } from "./credit-card-list"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends CreditCard, TValue>({
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
  const searchValue = (table.getColumn("name")?.getFilterValue() as string) ?? ""
  const isFiltering = Boolean(searchValue)

  const clearSearch = () => {
    table.getColumn("name")?.setFilterValue("")
  }

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Barra de Busca + CTA Criar Cartão (Desktop) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cartão por nome..."
            value={searchValue}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-9 h-10 sm:h-9 text-xs sm:text-sm bg-card/60 border-border/70 w-full"
          />
        </div>

        <div className="hidden sm:block">
          <CreateCard />
        </div>
      </div>

      {/* 1. VISÃO MOBILE (< 768px): CreditCardList com Cards Estruturados */}
      <div className="block md:hidden w-full">
        {rows.length ? (
          <CreditCardList>
            {rows.map((row) => (
              <CreditCardListItem key={row.id} card={row.original as CreditCard} />
            ))}
          </CreditCardList>
        ) : isFiltering ? (
          <EmptyState
            icon={CardIcon}
            title="Nenhum cartão encontrado"
            description="Não encontramos cartões de crédito correspondentes à busca."
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar busca
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={CardIcon}
            title="Nenhum cartão de crédito cadastrado"
            description="Cadastre seu primeiro cartão para acompanhar faturas, compras no crédito e limites."
            action={<CreateCard />}
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
                      icon={CardIcon}
                      title="Nenhum cartão encontrado"
                      description="Não há cartões de crédito correspondentes aos filtros selecionados."
                      action={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearSearch}
                          className="gap-1.5 text-xs"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Limpar busca
                        </Button>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={CardIcon}
                      title="Nenhum cartão de crédito cadastrado"
                      description="Cadastre seu primeiro cartão para organizar despesas no crédito."
                      action={<CreateCard />}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="cartão(ões) encontrado(s)." />
    </div>
  )
}
