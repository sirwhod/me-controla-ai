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
import { MobileList } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { PersonResponsible } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { CheckCircle2, MoreHorizontal, Search, Users } from "lucide-react"
import { ResponsiblePixModal } from "@/app/components/responsible-pix-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { EditResponsible } from "@/app/components/edit-responsible"
import { DeleteResponsible } from "@/app/components/delete-responsible"

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

  return (
    <div className="flex flex-col space-y-4">
      {/* Barra de Busca + Tabs de Filtro de Saldo + Botão Novo Responsável */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar responsável..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end">
          {/* Quick Filter Tabs */}
          <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-card/60">
            <button
              type="button"
              onClick={() => setBalanceStatusFilter("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
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
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
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
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                balanceStatusFilter === "settled"
                  ? "bg-emerald-500 text-white font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Em dia
            </button>
          </div>

          <CreateResponsible />
        </div>
      </div>

      {/* 1. VISÃO MOBILE (< 768px): MobileList com Cards */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const resp = row.original as PersonResponsible & { pendingBalance: number }
              const balance = resp.pendingBalance || 0
              const hasDebt = balance > 0

              return (
                <div
                  key={row.id}
                  className="p-3.5 flex flex-col gap-3 transition-colors border-b border-border/40 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 border border-border shrink-0">
                        {resp.userImage && <AvatarImage src={resp.userImage} alt={resp.name} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {resp.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-sm font-semibold text-foreground truncate">
                            {resp.name}
                          </strong>
                          {resp.isRegisteredUser && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            >
                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                              Usuário
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {resp.email || "Sem e-mail cadastrado"}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Opções do responsável"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(resp.id || "")}
                        >
                          Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditResponsible responsible={resp} asDropdownItem />
                        {resp.id && <DeleteResponsible responsibleId={resp.id} responsibleName={resp.name} asDropdownItem />}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Rodapé do Card: Saldo + Botão de Cobrança PIX */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Saldo Devedor
                      </span>
                      {hasDebt ? (
                        <span className="text-sm font-bold text-rose-500">
                          {formatCurrency(balance)}{" "}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            (A receber)
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-500">
                          R$ 0,00 (Em dia)
                        </span>
                      )}
                    </div>

                    <ResponsiblePixModal
                      responsibleId={resp.id}
                      responsibleName={resp.name}
                      pendingBalance={resp.pendingBalance || 0}
                      month={month}
                      year={year}
                    />
                  </div>
                </div>
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={Users}
            title="Nenhum responsável encontrado"
            description="Cadastre pessoas para vincular a despesas compartilhadas e gerar cobranças automáticas via PIX."
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
                    icon={Users}
                    title="Nenhum responsável cadastrado"
                    description="Não há responsáveis correspondentes aos filtros selecionados."
                  />
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
