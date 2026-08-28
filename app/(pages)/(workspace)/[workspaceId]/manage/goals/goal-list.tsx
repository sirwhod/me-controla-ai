"use client"

import * as React from "react"
import { Goal } from "@/app/types/financial"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { Calendar, CheckCircle2, MoreHorizontal, Target } from "lucide-react"
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
import { GoalContributionDialog } from "@/app/components/goal-contribution-dialog"
import { EditGoal } from "@/app/components/edit-goal"
import { DeleteGoal } from "@/app/components/delete-goal"

interface GoalListProps {
  children: React.ReactNode
  className?: string
}

export function GoalList({ children, className }: GoalListProps) {
  return (
    <div className={`flex flex-col space-y-3 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface GoalListItemProps {
  goal: Goal
}

export function GoalListItem({ goal }: GoalListItemProps) {
  const current = Number(goal.currentAmount) || 0
  const target = Number(goal.targetAmount) || 1
  const percentage = Math.min(100, Math.round((current / target) * 100))
  const remaining = Math.max(target - current, 0)
  const isCompleted = current >= target

  const endFormatted = goal.endDate
    ? format(new Date(goal.endDate), "dd/MM/yyyy")
    : "Sem prazo"

  return (
    <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur-xs p-3.5 sm:p-4 shadow-xs flex flex-col gap-3 hover:bg-card/90 transition-all">
      {/* 1. Header do Card: Ícone, Nome, Status e Menu de Ações */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                {goal.name}
              </span>
              {isCompleted ? (
                <Badge className="text-[10px] bg-emerald-500 text-white font-medium">
                  Concluída
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-primary border-primary/40 font-medium">
                  Em andamento
                </Badge>
              )}
            </div>
            {goal.description && (
              <span className="text-xs text-muted-foreground truncate mt-0.5">
                {goal.description}
              </span>
            )}
          </div>
        </div>

        {/* Menu Contextual (Touch target confortável: 40x40px) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Ações da meta ${goal.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Opções</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(goal.id)}
              className="text-xs cursor-pointer"
            >
              Copiar ID da meta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <GoalContributionDialog goal={goal} asDropdownItem />
            <EditGoal goal={goal} asDropdownItem />
            <DeleteGoal goalId={goal.id} goalName={goal.name} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Caixa de Progresso e Valores */}
      <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground sm:text-sm">
            {formatCurrency(current)}{" "}
            <span className="font-normal text-muted-foreground text-xs">
              de {formatCurrency(target)}
            </span>
          </span>
          <span className={`font-bold text-xs sm:text-sm ${isCompleted ? "text-emerald-500" : "text-primary"}`}>
            {percentage}%
          </span>
        </div>

        {/* Barra de Progresso */}
        <div
          className="h-2 w-full rounded-full bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isCompleted ? "bg-emerald-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Informações Complementares */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span>
            {isCompleted ? (
              <strong className="text-emerald-500">Objetivo alcançado! 🎉</strong>
            ) : (
              <>
                Faltam: <strong className="text-foreground">{formatCurrency(remaining)}</strong>
              </>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {endFormatted}
          </span>
        </div>
      </div>

      {/* 3. Ação Rápida de Aporte */}
      <div className="flex justify-end pt-0.5">
        <GoalContributionDialog goal={goal} />
      </div>
    </div>
  )
}
