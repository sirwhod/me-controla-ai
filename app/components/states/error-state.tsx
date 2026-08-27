"use client"

import * as React from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/app/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = "Ocorreu um erro",
  message = "Não foi possível carregar as informações. Verifique sua conexão e tente novamente.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-destructive/30 bg-destructive/5 backdrop-blur-xs",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3.5 ring-4 ring-destructive/5">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
        {message}
      </p>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-5 gap-2 border-border/80 hover:bg-card"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
