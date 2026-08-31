"use client"

import * as React from "react"
import { Credit } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import {
  Calendar,
  CreditCard,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Tag,
  User,
  Pencil,
} from "lucide-react"
import Link from "@/app/components/context-link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Button } from "@/app/components/ui/button"
import { DeleteCredit } from "@/app/components/delete-credit"

interface RevenueListProps {
  children: React.ReactNode
  className?: string
}

export function RevenueList({ children, className }: RevenueListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface RevenueListItemProps {
  credit: Credit
}

export function RevenueListItem({ credit }: RevenueListItemProps) {
  const dateFormatted = credit.date
    ? format(new Date(credit.date), "dd/MM/yyyy")
    : "-"

  const categoryIcon = credit.categoryUrl
  const categoryName = credit.categoryName || "Sem categoria"
  const responsible = credit.responsibleName
  const bankName = credit.bankName
  const paymentMethod = credit.paymentMethod
  const formattedValue = formatCurrency(Number(credit.value) || 0)

  return (
    <div className="flex flex-col p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-2.5">
      {/* Linha 1: Ícone + Descrição + Menu de Ações (3 pontinhos) */}
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
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

          <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
            <span className="font-semibold text-sm sm:text-base text-foreground truncate">
              {credit.description}
            </span>
          </div>
        </div>

        {/* Menu Contextual (Touch target amplo: 40x40px) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 -mt-1 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Opções da receita ${credit.description}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(credit.id || "")}
              className="text-xs cursor-pointer"
            >
              Copiar ID da receita
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/${credit.workspaceId}/dashboard/credits/${credit.id}/edit`}
                className="cursor-pointer flex items-center text-xs"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DeleteCredit creditId={credit.id} creditDescription={credit.description} />
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

      {/* Linha 3: Metadados (Banco • Forma de Pagamento • Data) + Valor Positivo em Destaque */}
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

        {/* Valor Positivo Formatado em Destaque */}
        <div className="flex flex-col items-end">
          <span className="text-base font-bold text-emerald-500 tracking-tight whitespace-nowrap">
            + {formattedValue}
          </span>
        </div>
      </div>
    </div>
  )
}
