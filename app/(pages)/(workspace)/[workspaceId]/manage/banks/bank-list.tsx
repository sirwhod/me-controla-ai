"use client"

import * as React from "react"
import { Bank } from "@/app/types/financial"
import { CreditCard, Landmark, MoreHorizontal, QrCode, Copy } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
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
import { EditBank } from "@/app/components/edit-bank"
import { DeleteBank } from "@/app/components/delete-bank"

interface BankListProps {
  children: React.ReactNode
  className?: string
}

export function BankList({ children, className }: BankListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface BankListItemProps {
  bank: Bank
}

export function BankListItem({ bank }: BankListItemProps) {
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
    <div className="flex flex-col p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      {/* 1. Instituição / Banco + Informações da Conta / Cartões + Menu de Ações */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {bank.iconUrl ? (
            <Image
              src={bank.iconUrl}
              alt={bank.name}
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-contain border border-border/60 bg-background p-1 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Landmark className="h-5 w-5" />
            </div>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <strong className="text-sm sm:text-base font-semibold text-foreground truncate">
              {bank.name}
            </strong>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {bank.code && (
                <span className="text-xs text-muted-foreground">
                  Cód: {bank.code}
                </span>
              )}
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4.5 gap-1 bg-muted/50 border-border/40 shrink-0"
              >
                <CreditCard className="h-2.5 w-2.5 text-primary" />
                {count === 1 ? "1 cartão" : `${count} cartões`}
              </Badge>
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
              aria-label={`Opções do banco ${bank.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(bank.id)}
              className="text-xs cursor-pointer"
            >
              Copiar ID do banco
            </DropdownMenuItem>
            {pixKey && (
              <DropdownMenuItem
                onClick={handleCopyPix}
                className="text-xs cursor-pointer"
              >
                Copiar Chave PIX
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <EditBank bank={bank} asDropdownItem />
            <DeleteBank bankId={bank.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Informação de Chave PIX com 1-tap copy e privacidade */}
      {pixKey ? (
        <button
          type="button"
          onClick={handleCopyPix}
          className="flex items-center justify-between p-2.5 rounded-lg bg-background/70 border border-border/50 hover:bg-accent/50 transition-all text-left cursor-pointer gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-sm bg-emerald-500/10 text-emerald-500 shrink-0">
              <QrCode className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-mono font-bold tracking-widest text-muted-foreground truncate">
                ••••••••••••
              </span>
              {pixKeyType && (
                <span className="text-[10px] uppercase text-muted-foreground/70">
                  Tipo: {pixKeyType}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-primary shrink-0">
            <Copy className="h-3 w-3" />
            <span>Copiar</span>
          </div>
        </button>
      ) : (
        <div className="text-[11px] text-muted-foreground italic px-1">
          Nenhuma chave PIX cadastrada para este banco.
        </div>
      )}
    </div>
  )
}
