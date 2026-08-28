"use client"

import React from "react"
import { BanknoteArrowDown, CalendarSync, CreditCard, Pin } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { TypeDebit } from "@/app/types/financial"

interface StepTypeProps {
  selectedType: TypeDebit | undefined
  onSelectType: (type: TypeDebit) => void
}

interface TypeOption {
  type: TypeDebit
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "Comum",
    title: "Comum",
    description: "Despesa única, paga em uma data.",
    icon: <BanknoteArrowDown className="h-6 w-6 text-rose-500" />,
    iconBg: "bg-rose-500/10 text-rose-500",
  },
  {
    type: "Fixo",
    title: "Fixo",
    description: "Despesa recorrente com frequência definida.",
    icon: <Pin className="h-6 w-6 text-amber-500" />,
    iconBg: "bg-amber-500/10 text-amber-500",
  },
  {
    type: "Assinatura",
    title: "Assinatura",
    description: "Serviços e assinaturas recorrentes.",
    icon: <CalendarSync className="h-6 w-6 text-blue-500" />,
    iconBg: "bg-blue-500/10 text-blue-500",
  },
  {
    type: "Parcelamento",
    title: "Parcelado",
    description: "Despesa dividida em várias parcelas mensais (Pix, Cartão, etc.).",
    icon: <CreditCard className="h-6 w-6 text-purple-500" />,
    iconBg: "bg-purple-500/10 text-purple-500",
  },
]

export function StepType({ selectedType, onSelectType }: StepTypeProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Escolha o tipo de despesa
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Vamos começar! Escolha o tipo de despesa que deseja adicionar à caixinha.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2" role="radiogroup" aria-label="Tipos de Despesa">
        {TYPE_OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.type

          return (
            <button
              key={opt.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectType(opt.type)}
              className={cn(
                "flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden group",
                "bg-card/70 hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                  : "border-border/70 hover:border-border"
              )}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className={cn("p-2.5 rounded-lg transition-colors", opt.iconBg)}>
                  {opt.icon}
                </div>
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                </div>
              </div>

              <span className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {opt.title}
              </span>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {opt.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
