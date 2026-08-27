"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

interface SummaryKpiBarProps {
  type: "debit" | "credit"
  total: number
  count: number
  dailyAverage: number
  className?: string
}

export function SummaryKpiBar({
  type,
  total,
  count,
  dailyAverage,
  className,
}: SummaryKpiBarProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val)
  }

  const isDebit = type === "debit"

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card/70 backdrop-blur-xs p-3.5 shadow-xs transition-all",
        className
      )}
    >
      <div className="grid grid-cols-3 divide-x divide-border/50 text-center items-center">
        {/* Total */}
        <div className="flex flex-col items-center justify-center px-1 md:px-3">
          <span className="text-[11px] md:text-xs font-medium text-muted-foreground line-clamp-1">
            {isDebit ? "Total de despesas" : "Total de receitas"}
          </span>
          <span
            className={cn(
              "text-sm sm:text-base md:text-lg font-bold tracking-tight mt-0.5 whitespace-nowrap",
              isDebit ? "text-foreground" : "text-emerald-500"
            )}
          >
            {formatCurrency(total)}
          </span>
        </div>

        {/* Qtd. lançamentos */}
        <div className="flex flex-col items-center justify-center px-1 md:px-3">
          <span className="text-[11px] md:text-xs font-medium text-muted-foreground line-clamp-1">
            Qtd. lançamentos
          </span>
          <span className="text-sm sm:text-base md:text-lg font-bold text-foreground tracking-tight mt-0.5">
            {count}
          </span>
        </div>

        {/* Média por dia */}
        <div className="flex flex-col items-center justify-center px-1 md:px-3">
          <span className="text-[11px] md:text-xs font-medium text-muted-foreground line-clamp-1">
            Média por dia
          </span>
          <span className="text-sm sm:text-base md:text-lg font-bold text-foreground tracking-tight mt-0.5 whitespace-nowrap">
            {formatCurrency(dailyAverage)}
          </span>
        </div>
      </div>
    </div>
  )
}
