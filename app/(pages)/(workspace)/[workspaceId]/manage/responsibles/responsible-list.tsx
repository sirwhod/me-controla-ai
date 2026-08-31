"use client"

import * as React from "react"
import { PersonResponsible } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { CheckCircle2, MoreHorizontal, Mail, DollarSign, Pencil } from "lucide-react"
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
import { DeleteResponsible } from "@/app/components/delete-responsible"
import { ResponsiblePixModal } from "@/app/components/responsible-pix-modal"

interface ResponsibleListProps {
  children: React.ReactNode
  className?: string
}

export function ResponsibleList({ children, className }: ResponsibleListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface ResponsibleListItemProps {
  resp: PersonResponsible & { pendingBalance: number }
  month?: string
  year?: string
}

export function ResponsibleListItem({ resp, month, year }: ResponsibleListItemProps) {
  const balance = resp.pendingBalance || 0
  const hasDebt = balance > 0
  const initials = (resp.name || "??")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-col p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      {/* 1. Identificação + Informações de Contato + Menu de Ações */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar className="h-11 w-11 border border-border shrink-0">
            {resp.userImage && <AvatarImage src={resp.userImage} alt={resp.name} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-sm sm:text-base font-semibold text-foreground truncate">
                {resp.name}
              </strong>
              {resp.isRegisteredUser && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  Usuário
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 min-w-0">
              <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <span className="truncate">
                {resp.email ? resp.email : "Sem e-mail cadastrado"}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Contextual (Touch target confortável: 40x40px) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 -mt-1 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Opções de ${resp.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(resp.id || "")}
              className="text-xs cursor-pointer"
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/${resp.workspaceId}/manage/responsibles/${resp.id}/edit`}
                className="cursor-pointer flex items-center text-xs"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Editar
              </Link>
            </DropdownMenuItem>
            {resp.id && (
              <DeleteResponsible
                responsibleId={resp.id}
                responsibleName={resp.name}
                asDropdownItem
              />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Informação Financeira (Saldo Devedor) + Status + Ação PIX */}
      <div className="flex items-end justify-between pt-2.5 border-t border-border/30 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground/70" />
            Saldo Devedor
          </span>

          <div className="flex items-baseline gap-1.5">
            {hasDebt ? (
              <span className="text-base font-bold text-rose-500 tracking-tight">
                {formatCurrency(balance)}
              </span>
            ) : (
              <span className="text-base font-bold text-emerald-500 tracking-tight">
                R$ 0,00
              </span>
            )}
          </div>

          {/* Status Indicador com ponto colorido acessível */}
          {hasDebt ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span>A receber</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Em dia</span>
            </div>
          )}
        </div>

        {/* Gatilho Rápido de Cobrança PIX */}
        <div className="shrink-0">
          <ResponsiblePixModal
            responsibleId={resp.id}
            responsibleName={resp.name}
            pendingBalance={resp.pendingBalance || 0}
            month={month}
            year={year}
          />
        </div>
      </div>
    </div>
  )
}
