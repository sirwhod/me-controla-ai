"use client"

import * as React from "react"
import { CreditCard } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { CreditCard as CardIcon, Landmark, MoreHorizontal, Calendar, DollarSign } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
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

interface CreditCardListProps {
  children: React.ReactNode
  className?: string
}

export function CreditCardList({ children, className }: CreditCardListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface CreditCardListItemProps {
  card: CreditCard
}

export function CreditCardListItem({ card }: CreditCardListItemProps) {
  const limit = card.limit ? Number(card.limit) : 0

  return (
    <div className="flex flex-col p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      {/* 1. Identificação do Cartão (Ícone + Nome + Últimos 4 Dígitos) + Menu de Ações */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0 border border-violet-500/20">
            <CardIcon className="h-5 w-5" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <strong className="text-sm sm:text-base font-semibold text-foreground truncate">
                {card.name}
              </strong>
              {card.last4Digits && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono px-1.5 py-0 border-muted-foreground/30 bg-muted/20 shrink-0"
                >
                  •••• {card.last4Digits}
                </Badge>
              )}
            </div>

            {card.bankName ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 min-w-0">
                <Landmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                <span className="truncate font-medium">{card.bankName}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/70 mt-0.5">Sem banco emissor</span>
            )}
          </div>
        </div>

        {/* Menu Contextual (Touch target confortável: 40x40px) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 -mt-1 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Opções do cartão ${card.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(card.id)}
              className="text-xs cursor-pointer"
            >
              Copiar ID do cartão
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <EditCard card={card} asDropdownItem />
            <DeleteCard cardId={card.id} cardName={card.name} asDropdownItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Informações de Fatura (Vencimento / Fechamento) e Limite Total */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-background/70 border border-border/50 text-xs gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>
              Fechamento: <strong className="text-foreground">Dia {card.closingDay}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span>
              Vencimento: <strong className="text-foreground">Dia {card.dueDay}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground/70" />
            Limite Total
          </span>
          <span className="text-sm font-bold text-foreground tracking-tight">
            {limit ? (
              formatCurrency(limit)
            ) : (
              <span className="text-muted-foreground font-normal text-xs">Sem limite</span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
