"use client"

import * as React from "react"
import { Filter, X, Check, Tags, Landmark, CreditCard, Banknote } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/app/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Bank, Category } from "@/app/types/financial"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"
import { cn } from "@/app/lib/utils"

interface BottomSheetFiltersProps {
  categories?: Category[]
  banks?: Bank[]
  categoryFilter: string
  onCategoryChange: (value: string) => void
  bankFilter: string
  onBankChange: (value: string) => void
  paymentMethodFilter: string
  onPaymentMethodChange: (value: string) => void
  onClearFilters: () => void
  totalCount?: number
  className?: string
}

export function BottomSheetFilters({
  categories,
  banks,
  categoryFilter,
  onCategoryChange,
  bankFilter,
  onBankChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  onClearFilters,
  totalCount,
  className,
}: BottomSheetFiltersProps) {
  const [open, setOpen] = React.useState(false)

  // Estados temporários para o BottomSheet (permite "Aplicar filtros" ou "Cancelar")
  const [tempCategory, setTempCategory] = React.useState(categoryFilter)
  const [tempBank, setTempBank] = React.useState(bankFilter)
  const [tempPaymentMethod, setTempPaymentMethod] = React.useState(paymentMethodFilter)

  // Sincronizar quando o sheet abrir
  React.useEffect(() => {
    if (open) {
      setTempCategory(categoryFilter)
      setTempBank(bankFilter)
      setTempPaymentMethod(paymentMethodFilter)
    }
  }, [open, categoryFilter, bankFilter, paymentMethodFilter])

  const activeCount = [categoryFilter, bankFilter, paymentMethodFilter].filter(Boolean).length

  const handleApply = () => {
    onCategoryChange(tempCategory)
    onBankChange(tempBank)
    onPaymentMethodChange(tempPaymentMethod)
    setOpen(false)
  }

  const handleClear = () => {
    setTempCategory("")
    setTempBank("")
    setTempPaymentMethod("")
    onClearFilters()
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-3 gap-1.5 text-xs font-semibold rounded-lg bg-card/80 border-border/80 hover:bg-accent hover:text-foreground transition-all relative",
            activeCount > 0 && "border-primary/50 text-primary bg-primary/10",
            className
          )}
        >
          <Filter className="h-3.5 w-3.5 shrink-0" />
          <span>Filtros</span>
          {activeCount > 0 && (
            <Badge
              variant="default"
              className="h-4.5 min-w-4.5 px-1 py-0 text-[10px] font-bold rounded-full ml-0.5 bg-primary text-primary-foreground"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl p-5 overflow-y-auto">
        <SheetHeader className="text-left pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              Filtrar Lançamentos
            </SheetTitle>
            {totalCount !== undefined && (
              <span className="text-xs text-muted-foreground font-medium">
                {totalCount} registro(s)
              </span>
            )}
          </div>
          <SheetDescription className="text-xs">
            Refine a listagem por categoria, conta ou método de pagamento.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* 1. Filtro de Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-primary" />
              Categoria
            </label>
            <Select
              value={tempCategory || "all"}
              onValueChange={(val) => setTempCategory(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full h-10 text-xs bg-background/80">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <DynamicIcon
                      name={cat.icon as IconName}
                      className="w-4 h-4 mr-2 inline-block"
                    />
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Filtro de Banco / Conta */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-primary" />
              Banco / Conta
            </label>
            <Select
              value={tempBank || "all"}
              onValueChange={(val) => setTempBank(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full h-10 text-xs bg-background/80">
                <SelectValue placeholder="Todos os bancos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os bancos</SelectItem>
                {banks?.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.iconUrl ? (
                      <Image
                        src={bank.iconUrl}
                        alt=""
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-xs inline-block mr-2"
                      />
                    ) : (
                      <Landmark className="h-4 w-4 inline-block mr-2 text-muted-foreground" />
                    )}
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Filtro de Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              Forma de Pagamento
            </label>
            <Select
              value={tempPaymentMethod || "all"}
              onValueChange={(val) => setTempPaymentMethod(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-full h-10 text-xs bg-background/80">
                <SelectValue placeholder="Todas as formas de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas de pagamento</SelectItem>
                <SelectItem value="Pix">
                  <span className="mr-2">⚡</span> Pix
                </SelectItem>
                <SelectItem value="Crédito">
                  <CreditCard className="w-4 h-4 mr-2 inline-block" /> Crédito
                </SelectItem>
                <SelectItem value="Débito">
                  <Banknote className="w-4 h-4 mr-2 inline-block" /> Débito
                </SelectItem>
                <SelectItem value="Conta">
                  <Landmark className="w-4 h-4 mr-2 inline-block" /> Conta / TED
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex flex-row gap-2 pt-2 border-t border-border/40 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="flex-1 h-10 text-xs gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Limpar filtros
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleApply}
            className="flex-1 h-10 text-xs gap-1 font-semibold"
          >
            <Check className="h-3.5 w-3.5" />
            Aplicar filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
