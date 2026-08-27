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
import { CreateBank } from "@/app/components/create-bank"
import { MobileList } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { Bank } from "@/app/types/financial"
import { CreditCard, Landmark, MoreHorizontal, QrCode, Search } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { EditBank } from "@/app/components/edit-bank"
import { DeleteBank } from "@/app/components/delete-bank"
import { Badge } from "@/app/components/ui/badge"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends Bank, TValue>({
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
      {/* Barra de Busca + CTA Criar Banco */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar banco ou conta..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9 text-xs"
          />
        </div>
        <CreateBank />
      </div>

      {/* 1. VISÃO MOBILE (< 768px): BankAccountCards em MobileList */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const bank = row.original as Bank
              const count = bank.cardsCount || 0
              const pixKey = bank.pixKey
              const pixKeyType = bank.pixKeyType

              const handleCopyPix = (e: React.MouseEvent) => {
                e.stopPropagation()
                if (!pixKey) return
                navigator.clipboard.writeText(pixKey)
                toast.success("Chave PIX copiada para a área de transferência!")
              }

              return (
                <div
                  key={row.id}
                  className="p-3.5 flex flex-col gap-3 border-b border-border/40 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {bank.iconUrl ? (
                        <Image
                          src={bank.iconUrl}
                          alt={bank.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-xl object-contain border border-border/60 bg-background p-1 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                          <Landmark className="h-5 w-5" />
                        </div>
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <strong className="text-sm font-semibold text-foreground truncate">
                          {bank.name}
                        </strong>
                        <div className="flex items-center gap-2 mt-0.5">
                          {bank.code && (
                            <span className="text-xs text-muted-foreground">
                              Cód: {bank.code}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5 gap-1">
                            <CreditCard className="h-2.5 w-2.5 text-primary" />
                            {count === 1 ? "1 cartão" : `${count} cartões`}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                          aria-label="Opções do banco"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(bank.id)}
                        >
                          Copiar ID do banco
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <EditBank bank={bank} asDropdownItem />
                        <DeleteBank bankId={bank.id} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Chave PIX com 1-tap copy e privacidade */}
                  {pixKey ? (
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background/60 border border-border/40 hover:bg-accent/50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-sm bg-emerald-500/10 text-emerald-500">
                          <QrCode className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold tracking-widest text-muted-foreground">
                            ••••••••••••
                          </span>
                          {pixKeyType && (
                            <span className="text-[10px] uppercase text-muted-foreground/70">
                              Tipo: {pixKeyType}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-primary">
                        Copiar chave
                      </span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-muted-foreground italic px-1">
                      Nenhuma chave PIX cadastrada para este banco.
                    </div>
                  )}
                </div>
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={Landmark}
            title="Nenhum banco encontrado"
            description="Cadastre suas contas correntes e bancos para organizar despesas e receitas."
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
                    icon={Landmark}
                    title="Nenhum banco cadastrado"
                    description="Crie seu primeiro banco ou conta para começar."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="banco(s) encontrado(s)." />
    </div>
  )
}
