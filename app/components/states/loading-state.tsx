"use client"

import * as React from "react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { cn } from "@/app/lib/utils"

interface LoadingStateProps {
  variant?: "list" | "card" | "table" | "dashboard" | "page"
  count?: number
  className?: string
}

export function LoadingState({
  variant = "list",
  count = 5,
  className,
}: LoadingStateProps) {
  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
        {Array.from({ length: count || 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 rounded-xl border border-border/50 bg-card p-4 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-56 w-full" />
          </div>
          <div className="col-span-3 rounded-xl border border-border/50 bg-card p-4 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "table") {
    return (
      <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden p-4 space-y-3", className)}>
        <div className="flex justify-between pb-2 border-b border-border/40">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  // Padrão: List (Mobile cards)
  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-card/50 overflow-hidden shadow-xs",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3.5 gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-2/3 max-w-[160px]" />
              <Skeleton className="h-3 w-1/2 max-w-[110px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}
