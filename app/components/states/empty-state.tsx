"use client"

import * as React from "react"
import { LucideIcon, Inbox } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border/70 bg-card/30 backdrop-blur-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3.5 ring-4 ring-primary/5">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
