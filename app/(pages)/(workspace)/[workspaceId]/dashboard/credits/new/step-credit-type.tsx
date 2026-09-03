"use client"

import React from "react"
import { Banknote, Pin } from "lucide-react"
import { cn } from "@/app/lib/utils"
import { TypeCredit } from "@/app/types/financial"

interface StepCreditTypeProps {
  selectedType: TypeCredit | undefined
  onSelectType: (type: TypeCredit) => void
}

interface TypeOption {
  type: TypeCredit
  title: string
  description: string
  icon: React.ReactNode
  iconBg: string
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "Comum",
    title: "Comum",
    description: "Receita única ou pontual (ex: freelas, vendas, acertos).",
    icon: <Banknote className="h-6 w-6 text-success" />,
    iconBg: "bg-success/10 text-success",
  },
  {
    type: "Fixo",
    title: "Fixo",
    description: "Receita recorrente todo mês (ex: salário, pró-labore, aluguel).",
    icon: <Pin className="h-6 w-6 text-warning" />,
    iconBg: "bg-warning/10 text-warning",
  },
]

export function StepCreditType({ selectedType, onSelectType }: StepCreditTypeProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Escolha o tipo de receita
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Vamos começar! Escolha o tipo de receita que deseja registrar na caixinha.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2" role="radiogroup" aria-label="Tipos de Receita">
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
