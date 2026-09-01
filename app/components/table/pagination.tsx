import { Table } from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  footerText: string
}

export function DataTablePagination<TData>({
  table,
  footerText,
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = Math.max(1, table.getPageCount())
  const totalRows = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-1 lg:flex-row lg:gap-0">
      {/* Contador Total */}
      <div className="w-full text-center text-xs text-muted-foreground md:text-sm lg:w-auto lg:text-left">
        {totalRows} {footerText}
      </div>

      {/* Controles Mobile/Tablet (< 1024px) */}
      <div className="flex w-full items-center justify-between border-t border-border/40 pt-1 lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs gap-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </Button>

        <span className="text-xs font-semibold text-foreground px-2">
          {currentPage} / {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3 text-xs gap-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span>Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Controles Desktop (>= 1024px) */}
      <div className="hidden items-center gap-8 lg:flex">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Linhas por página</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[110px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Primeira Página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Página Anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Próxima Página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(totalPages - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Última Página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
