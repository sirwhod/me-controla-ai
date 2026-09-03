import * as React from "react"
import { cn } from "@/app/lib/utils"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

/** Shared title block for workspace pages. Breadcrumbs remain in the route shell. */
export function PageHeader({ title, description, icon, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
        {description && <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
