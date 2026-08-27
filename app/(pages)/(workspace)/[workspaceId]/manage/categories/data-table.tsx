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
import { CreateCategory } from "@/app/components/create-category"
import { MobileList } from "@/app/components/data-display/mobile-list"
import { EmptyState } from "@/app/components/states/empty-state"
import { Category } from "@/app/types/financial"
import { MoreHorizontal, Search, Tags } from "lucide-react"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { EditCategory } from "@/app/components/edit-category"
import { DeleteCategory } from "@/app/components/delete-category"
import { Badge } from "@/app/components/ui/badge"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends Category, TValue>({
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
      case "expense":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rose-500 border-rose-500/30 bg-rose-500/10">
            Despesa
          </Badge>
        )
      case "income":
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
            Receita
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Geral
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Barra de Busca + CTA Criar Categoria */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categorias..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-8 h-9 text-xs"
          />
        </div>

        <CreateCategory />
      </div>

      {/* 1. VISÃO MOBILE (< 768px): CategoryCards em MobileList */}
      <div className="block md:hidden">
        {rows.length ? (
          <MobileList>
            {rows.map((row) => {
              const category = row.original as Category
              const icon = category.icon as IconName

              return (
                <div
                  key={row.id}
                  className="p-3.5 flex items-center justify-between gap-3 border-b border-border/40 last:border-b-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <DynamicIcon name={icon} size={18} />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <strong className="text-sm font-semibold text-foreground truncate">
                        {category.name}
                      </strong>
                      <div className="mt-0.5">
                        {getTypeBadge(category.type)}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
                        aria-label="Opções da categoria"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(category.id)}
                      >
                        Copiar ID da categoria
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <EditCategory category={category} asDropdownItem />
                      <DeleteCategory categoryId={category.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </MobileList>
        ) : (
          <EmptyState
            icon={Tags}
            title="Nenhuma categoria encontrada"
            description="Cadastre categorias personalizadas para classificar seus lançamentos."
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
                    icon={Tags}
                    title="Nenhuma categoria cadastrada"
                    description="Crie sua primeira categoria para organizar gastos e ganhos."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 3. PAGINAÇÃO RESPONSIVA */}
      <DataTablePagination table={table} footerText="categoria(s) encontrada(s)." />
    </div>
  )
}
