"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover"
import { MONTHS, useDateFilter } from "@/app/contexts/date-filter-context"
import { cn } from "@/app/lib/utils"

interface MonthYearNavigatorProps {
  className?: string
  compact?: boolean
  showFullMonthName?: boolean
}

export function MonthYearNavigator({
  className,
  compact = false,
  showFullMonthName = false,
}: MonthYearNavigatorProps) {
  const {
    month,
    year,
    monthLabel,
    monthShort,
    goToPreviousMonth,
    goToNextMonth,
    setDate,
    goToCurrentMonth,
  } = useDateFilter()

  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [pickerYear, setPickerYear] = React.useState(year)

  // Sincronizar o ano do picker quando o ano do contexto mudar
  React.useEffect(() => {
    setPickerYear(year)
  }, [year])

  const handleSelectMonth = (monthKey: string) => {
    setDate(monthKey, pickerYear)
    setPopoverOpen(false)
  }

  const currentRealMonth = MONTHS[new Date().getMonth()].key
  const currentRealYear = new Date().getFullYear()
  const isCurrentMonthActive = month === currentRealMonth && year === currentRealYear

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border bg-background p-0.5 shadow-xs transition-colors hover:border-primary/40",
        className
      )}
    >
      {/* Botão Anterior (<) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-1"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Popover Seletor de Mês e Ano */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "h-8 px-2.5 text-xs font-semibold tracking-wide gap-1.5 hover:bg-accent/70 hover:text-foreground transition-all",
              compact ? "px-2" : "px-3"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            <span className="capitalize">
              {showFullMonthName ? `${monthLabel} de ${year}` : `${monthShort} ${year}`}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-3 shadow-lg" align="center" sideOffset={6}>
          {/* Header do Popover com Seletor de Ano */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPickerYear((prev) => prev - 1)}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            <span className="text-sm font-bold text-foreground">
              {pickerYear}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPickerYear((prev) => prev + 1)}
              aria-label="Próximo ano"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Grade de 12 Meses */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {MONTHS.map((m) => {
              const isSelected = m.key === month && pickerYear === year
              const isRealCurrent = m.key === currentRealMonth && pickerYear === currentRealYear

              return (
                <Button
                  key={m.key}
                  type="button"
                  size="sm"
                  variant={isSelected ? "default" : "ghost"}
                  onClick={() => handleSelectMonth(m.key)}
                  className={cn(
                    "h-8 text-xs font-medium relative",
                    isSelected && "font-bold shadow-xs",
                    !isSelected && isRealCurrent && "border border-primary/40 text-primary font-semibold",
                    !isSelected && !isRealCurrent && "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`${m.label} de ${pickerYear}`}
                  aria-current={isSelected ? "date" : undefined}
                >
                  {m.short.replace(".", "")}
                </Button>
              )
            })}
          </div>

          {/* Botão de Atalho para Mês Atual */}
          {!isCurrentMonthActive && (
            <div className="pt-3 mt-2 border-t flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  goToCurrentMonth()
                  setPopoverOpen(false)
                }}
              >
                <RotateCcw className="h-3 w-3" />
                Ir para Mês Atual ({MONTHS[new Date().getMonth()].short.replace(".", "")} {currentRealYear})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Botão Próximo (>) */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-1"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
