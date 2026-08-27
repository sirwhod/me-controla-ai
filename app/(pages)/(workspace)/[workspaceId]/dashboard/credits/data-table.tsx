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
import { MobileList, MobileListItem } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { Credit } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import {
  HandCoins,
  MoreHorizontal,
  PiggyBank,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { EditCredit } from "@/app/components/edit-credit"
import { DeleteCredit } from "@/app/components/delete-credit"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends Credit, TValue>({
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
      {/* 1. VISÃO MOBILE (< 768px): MobileList com Cards */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const credit = row.original as Credit
              const dateFormatted = credit.date
                ? format(new Date(credit.date), "dd/MM/yyyy")
                : "-"

              const categoryIcon = credit.categoryUrl
              const categoryName = credit.categoryName || "Geral"
              const responsible = credit.responsibleName
              const bankName = credit.bankName
              const paymentMethod = credit.paymentMethod

              return (
                <MobileListItem
                  key={row.id}
                  icon={
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      {categoryIcon ? (
                        <DynamicIcon
                          name={categoryIcon as IconName}
                          className="h-4.5 w-4.5 text-emerald-500"
                        />
                      ) : (
                        <PiggyBank className="h-4.5 w-4.5 text-emerald-500" />
                      )}
                    </div>
                  }
                  title={credit.description}
                  subtitle={
                    <span>
                      {categoryName}
                      {responsible && (
                        <>
                          {" "}
                          • <span className="text-foreground/90 font-medium">{responsible}</span>
                        </>
                      )}
                    </span>
                  }
                  meta={
                    <>
                      <span>{dateFormatted}</span>
                      {bankName && <span>• {bankName}</span>}
                      {paymentMethod && <span>• {paymentMethod}</span>}
                    </>
                  }
                  value={`+ ${formatCurrency(Number(credit.value) || 0)}`}
                  valueColor="positive"
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                          aria-label="Opções da receita"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(credit.id || "")}
                        >
                          Copiar ID da receita
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditCredit credit={credit} asDropdownItem />
                        <DeleteCredit creditId={credit.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={HandCoins}
            title="Nenhuma receita encontrada"
            description="Tente ajustar o período e os filtros aplicados ou crie uma nova receita."
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
                    icon={HandCoins}
                    title="Nenhuma receita cadastrada"
                    description="Não há lançamentos de receitas para o período e filtros selecionados."
                  />
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
