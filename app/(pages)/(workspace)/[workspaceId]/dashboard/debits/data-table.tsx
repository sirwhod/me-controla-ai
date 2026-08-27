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
import { Debit } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import {
  BanknoteArrowDown,
  CalendarSync,
  CreditCard,
  MoreHorizontal,
  Pin,
  Receipt,
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
import { EditDebit } from "@/app/components/edit-debit"
import { DeleteDebit } from "@/app/components/delete-debit"
import { Badge } from "@/app/components/ui/badge"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends Debit, TValue>({
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

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "Fixo":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-muted-foreground/30">
            <Pin className="h-2.5 w-2.5" /> Fixo
          </Badge>
        )
      case "Parcelamento":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-muted-foreground/30">
            <CreditCard className="h-2.5 w-2.5" /> Parcela
          </Badge>
        )
      case "Assinatura":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-muted-foreground/30">
            <CalendarSync className="h-2.5 w-2.5" /> Assinatura
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. VISÃO MOBILE (< 768px): MobileList com Cards */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const debit = row.original as Debit
              const dateFormatted = debit.date
                ? format(new Date(debit.date), "dd/MM/yyyy")
                : "-"

              const categoryIcon = debit.categoryUrl
              const categoryName = debit.categoryName || "Geral"
              const responsible = debit.responsibleName
              const bankName = debit.bankName
              const paymentMethod = debit.paymentMethod

              return (
                <MobileListItem
                  key={row.id}
                  icon={
                    <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 border border-rose-500/20">
                      {categoryIcon ? (
                        <DynamicIcon
                          name={categoryIcon as IconName}
                          className="h-4.5 w-4.5 text-rose-500"
                        />
                      ) : (
                        <BanknoteArrowDown className="h-4.5 w-4.5 text-rose-500" />
                      )}
                    </div>
                  }
                  title={debit.description}
                  statusBadge={getTypeBadge(debit.type)}
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
                  value={`- ${formatCurrency(Number(debit.value) || 0)}`}
                  valueColor="negative"
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                          aria-label="Opções da despesa"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(debit.id || "")}
                        >
                          Copiar ID do débito
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditDebit debit={debit} asDropdownItem />
                        {debit.id && <DeleteDebit debitId={debit.id} asDropdownItem />}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Nenhuma despesa encontrada"
            description="Tente ajustar o período e os filtros aplicados ou crie uma nova despesa."
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
                    icon={Receipt}
                    title="Nenhuma despesa cadastrada"
                    description="Não há lançamentos de despesas para o período e filtros selecionados."
                  />
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
