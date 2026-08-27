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
import { MobileList } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { CreditCard } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { CreditCard as CardIcon, Landmark, MoreHorizontal, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { EditCard } from "@/app/components/edit-card"
import { DeleteCard } from "@/app/components/delete-card"
import { Badge } from "@/app/components/ui/badge"

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

  return (
    <div className="flex flex-col space-y-4">
      {/* Barra de Busca + CTA Criar Cartão */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cartão..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9 text-xs"
          />
        </div>

        <CreateCard />
      </div>

      {/* 1. VISÃO MOBILE (< 768px): CreditCardCards em MobileList */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const card = row.original as CreditCard
              const limit = card.limit ? Number(card.limit) : 0

              return (
                <div
                  key={row.id}
                  className="p-3.5 flex flex-col gap-3 border-b border-border/40 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 border border-violet-500/20">
                        <CardIcon className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-semibold text-foreground truncate">
                            {card.name}
                          </strong>
                          {card.last4Digits && (
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                              •••• {card.last4Digits}
                            </Badge>
                          )}
                        </div>
                        {card.bankName && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Landmark className="h-3 w-3" />
                            <span>{card.bankName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Opções do cartão"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(card.id)}
                        >
                          Copiar ID do cartão
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditCard card={card} asDropdownItem />
                        <DeleteCard cardId={card.id} asDropdownItem />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Informações de Fatura e Limite */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/40 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-muted-foreground text-[11px]">
                        Fechamento: <strong className="text-foreground">Dia {card.closingDay}</strong>
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        Vencimento: <strong className="text-foreground">Dia {card.dueDay}</strong>
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Limite Total
                      </span>
                      <span className="font-bold text-foreground">
                        {limit ? formatCurrency(limit) : <span className="text-muted-foreground font-normal">Sem limite</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={CardIcon}
            title="Nenhum cartão de crédito encontrado"
            description="Cadastre seus cartões de crédito para acompanhar faturas e limites."
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
                    icon={CardIcon}
                    title="Nenhum cartão de crédito cadastrado"
                    description="Cadastre seu primeiro cartão para organizar despesas no crédito."
                  />
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
