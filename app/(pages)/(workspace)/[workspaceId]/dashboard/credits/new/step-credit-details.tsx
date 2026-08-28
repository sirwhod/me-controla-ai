"use client"

import React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { cn } from "@/app/lib/utils"
import { CreateCredit as CreateCreditProps } from "@/app/types/financial"

interface StepCreditDetailsProps {
  form: UseFormReturn<CreateCreditProps>
}

export function StepCreditDetails({ form }: StepCreditDetailsProps) {
  const creditType = form.watch("type")
  const isFixo = creditType === "Fixo"

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Detalhes da receita
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isFixo
            ? "Informe a data de início e o valor recorrente da sua receita fixa."
            : "Preencha a data, descrição e o valor da entrada."}
        </p>
      </div>

      <div className="space-y-3.5 pt-1">
        {/* Campo de Data */}
        <FormField
          control={form.control}
          name={isFixo ? "startDate" : "date"}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-xs font-semibold">
                {isFixo ? "Data de Início" : "Data da Receita"}
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal h-10 bg-card/60 border-border/80",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : new Date()}
                    defaultMonth={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
                        const iso = safeDate.toISOString()
                        field.onChange(iso)
                        if (isFixo) {
                          form.setValue("date", iso)
                        } else {
                          form.setValue("startDate", iso)
                        }
                      }
                    }}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-xs font-semibold">Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Salário, Freelance, Rendimentos, Aluguel..."
                  className="h-10 bg-card/60 border-border/80"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Valor */}
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-xs font-semibold">Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="R$ 0,00"
                  className="h-10 bg-card/60 border-border/80 text-base sm:text-sm font-semibold"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </FormControl>
              {isFixo && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Esta receita será projetada mensalmente até o final do ano vigente.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
