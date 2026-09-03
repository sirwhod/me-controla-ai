"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/app/lib/utils"

export interface StepItem {
  number: number
  title: string
}

interface CreditStepperProps {
  currentStep: number
  steps: StepItem[]
  onStepClick?: (stepNumber: number) => void
}

export function CreditStepper({ currentStep, steps, onStepClick }: CreditStepperProps) {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative max-w-lg mx-auto">
        {/* Linha conectora de fundo */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-border/60 z-0" />
        {/* Linha conectora de progresso preenchida */}
        <div
          className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 z-0"
          style={{
            width: `${((Math.min(currentStep, steps.length) - 1) / (steps.length - 1)) * 100}%`,
            maxWidth: "calc(100% - 48px)",
          }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isClickable = isCompleted && onStepClick

          return (
            <div
              key={step.number}
              className={cn(
                "flex flex-col items-center gap-1.5 z-10 select-none",
                isClickable && "cursor-pointer"
              )}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              aria-label={isClickable ? `Voltar para a etapa ${step.number}: ${step.title}` : undefined}
              onClick={() => {
                if (isClickable) {
                  onStepClick(step.number)
                }
              }}
              onKeyDown={(event) => {
                if (isClickable && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault()
                  onStepClick(step.number)
                }
              }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 shadow-xs",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                  !isCompleted && !isCurrent && "bg-card border border-border/80 text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? <Check className="h-4 w-4 stroke-[2.5]" /> : step.number}
              </div>
              <span
                className={cn(
                  "text-[11px] sm:text-xs font-medium transition-colors text-center tracking-tight",
                  isCurrent && "text-primary font-semibold",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
