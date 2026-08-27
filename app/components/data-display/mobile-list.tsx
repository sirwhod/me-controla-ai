"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

interface MobileListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function MobileList({ children, className, ...props }: MobileListProps) {
  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-card/50 backdrop-blur-xs overflow-hidden shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MobileListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  meta?: React.ReactNode
  value?: React.ReactNode
  valueColor?: "default" | "positive" | "negative" | "warning" | "muted"
  statusBadge?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
}

export function MobileListItem({
  icon,
  title,
  subtitle,
  meta,
  value,
  valueColor = "default",
  statusBadge,
  actions,
  onClick,
  className,
  ...props
}: MobileListItemProps) {
  const valueColorClass = {
    default: "text-foreground",
    positive: "text-emerald-500 font-bold",
    negative: "text-rose-500 font-bold",
    warning: "text-amber-500 font-bold",
    muted: "text-muted-foreground",
  }[valueColor]

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3.5 gap-3 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/40 active:bg-accent/70",
        className
      )}
      {...props}
    >
      {/* Lado Esquerdo: Ícone + Textos + Metadados */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-foreground truncate">{title}</span>
            {statusBadge && <div className="shrink-0">{statusBadge}</div>}
          </div>

          {subtitle && (
            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {subtitle}
            </div>
          )}

          {meta && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 mt-1 flex-wrap">
              {meta}
            </div>
          )}
        </div>
      </div>

      {/* Lado Direito: Valor + Menu de Ações */}
      <div className="flex items-center gap-1 shrink-0 text-right">
        {value && (
          <div className="flex flex-col items-end">
            <span className={cn("text-sm sm:text-base tracking-tight whitespace-nowrap", valueColorClass)}>
              {value}
            </span>
          </div>
        )}

        {actions && (
          <div className="shrink-0 ml-1 min-w-[36px] flex items-center justify-center">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
