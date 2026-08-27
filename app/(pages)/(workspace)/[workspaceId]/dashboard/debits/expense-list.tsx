"use client"

import * as React from "react"
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
  Tag,
  User,
  Landmark,
  Calendar,
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

interface ExpenseListProps {
  children: React.ReactNode
  className?: string
}

export function ExpenseList({ children, className }: ExpenseListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface ExpenseListItemProps {
  debit: Debit
}

export function ExpenseListItem({ debit }: ExpenseListItemProps) {
  const dateFormatted = debit.date
    ? format(new Date(debit.date), "dd/MM/yyyy")
    : "-"

  const categoryIcon = debit.categoryUrl
  const categoryName = debit.categoryName || "Sem categoria"
  const responsible = debit.responsibleName
  const bankName = debit.bankName
  const paymentMethod = debit.paymentMethod
  const formattedValue = formatCurrency(Number(debit.value) || 0)

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "Fixo":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-amber-500/30 text-amber-500 bg-amber-500/10 font-normal shrink-0"
          >
            <Pin className="h-2.5 w-2.5" /> Fixo
          </Badge>
        )
      case "Parcelamento":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-purple-500/30 text-purple-500 bg-purple-500/10 font-normal shrink-0"
          >
            <CreditCard className="h-2.5 w-2.5" /> Parcela
          </Badge>
        )
      case "Assinatura":
        return (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4.5 gap-1 border-blue-500/30 text-blue-500 bg-blue-500/10 font-normal shrink-0"
          >
            <CalendarSync className="h-2.5 w-2.5" /> Assinatura
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-2.5">
      {/* Linha 1: Ícone + Descrição + Badge de Tipo + Menu de Ações (3 pontinhos) */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            <span className="font-semibold text-sm sm:text-base text-foreground truncate">
              {debit.description}
            </span>
            {getTypeBadge(debit.type)}
          </div>
        </div>

        {/* Menu Contextual (Touch target amplo: 40x40px) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 -mt-1 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Opções da despesa ${debit.description}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(debit.id || "")}
              className="text-xs cursor-pointer"
            >
              Copiar ID do débito
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <EditDebit debit={debit} asDropdownItem />
            {debit.id && <DeleteDebit debitId={debit.id} asDropdownItem />}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Linha 2: Categoria • Responsável */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1 flex-wrap">
        <span className="flex items-center gap-1 text-foreground/80 font-medium">
          <Tag className="h-3 w-3 text-muted-foreground/70" />
          {categoryName}
        </span>
        {responsible && (
          <>
            <span className="text-muted-foreground/40">•</span>
            <span className="flex items-center gap-1 text-foreground/90 font-medium">
              <User className="h-3 w-3 text-muted-foreground/70" />
              {responsible}
            </span>
          </>
        )}
      </div>

      {/* Linha 3: Metadados (Banco • Forma de Pagamento • Data) + Valor em Destaque */}
      <div className="flex items-end justify-between pt-1 border-t border-border/30 gap-2">
        <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground/80">
          <div className="flex items-center gap-1.5 flex-wrap">
            {bankName && (
              <span className="flex items-center gap-1">
                <Landmark className="h-3 w-3 text-muted-foreground/60" />
                {bankName}
              </span>
            )}
            {paymentMethod && (
              <>
                {bankName && <span className="text-muted-foreground/40">•</span>}
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-muted-foreground/60" />
                  {paymentMethod}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground/70">
            <Calendar className="h-3 w-3 text-muted-foreground/60" />
            <span>{dateFormatted}</span>
          </div>
        </div>

        {/* Valor Negativo Formatado em Destaque */}
        <div className="flex flex-col items-end">
          <span className="text-base font-bold text-rose-500 tracking-tight whitespace-nowrap">
            - {formattedValue}
          </span>
        </div>
      </div>
    </div>
  )
}
