"use client"

import React from "react"
import { CalendarIcon, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UseFormReturn } from "react-hook-form"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { cn, formatCurrency } from "@/app/lib/utils"
import { CreateDebit as CreateDebitProps } from "@/app/types/financial"

interface StepDetailsProps {
  form: UseFormReturn<CreateDebitProps>
}

export function StepDetails({ form }: StepDetailsProps) {
  const debitType = form.watch("type")
  const isParcelado = debitType === "Parcelamento"
  const isFixoOuAssinatura = debitType === "Fixo" || debitType === "Assinatura"

  const totalValue = form.watch("value") || 0
  const totalInstallments = form.watch("totalInstallments") || 2
  const currentInstallment = form.watch("currentInstallment") || 1
  const installmentApprox = totalInstallments > 0 ? totalValue / totalInstallments : 0

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Detalhes da despesa
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isParcelado
            ? "Informe as parcelas e o valor total da compra no cartão."
            : "Preencha as informações básicas para registrar seu gasto."}
        </p>
      </div>

      <div className="space-y-3.5 pt-1">
        {/* Campo de Data */}
        <FormField
          control={form.control}
          name={isParcelado || isFixoOuAssinatura ? "startDate" : "date"}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-xs font-semibold">
                {isParcelado ? "Data da Compra / Fatura" : isFixoOuAssinatura ? "Data de Início" : "Data da Despesa"}
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
                        if (isParcelado || isFixoOuAssinatura) {
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

        {/* Campos exclusivos de Parcelamento */}
        {isParcelado && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3 w-full">
              <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-xs font-semibold">Total de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ex: 12"
                        className="h-10 bg-card/60 border-border/80"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/\D/g, "")
                          const numVal = rawVal === "" ? undefined : Number(rawVal)
                          field.onChange(numVal)
                          const cur = form.getValues("currentInstallment")
                          if (cur && numVal && cur > numVal) {
                            form.setValue("currentInstallment", numVal)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentInstallment"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-xs font-semibold">Parcela Deste Mês</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Ex: 1"
                        className="h-10 bg-card/60 border-border/80"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/\D/g, "")
                          const numVal = rawVal === "" ? undefined : Number(rawVal)
                          field.onChange(numVal)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resumo em tempo real do parcelamento */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1.5 text-xs">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Resumo do Parcelamento
                </span>
                <span className="text-primary font-bold text-sm">
                  {totalInstallments > 0
                    ? `${totalInstallments}x de ${formatCurrency(installmentApprox)}`
                    : "Aguardando parcelas..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-primary/10 text-[11px] sm:text-xs">
                <span>Valor Total da Compra: <strong className="text-foreground">{formatCurrency(totalValue)}</strong></span>
                <span>
                  Parcela deste mês:{" "}
                  <strong className="text-foreground">
                    {currentInstallment > 0 && totalInstallments > 0
                      ? `${currentInstallment}ª de ${totalInstallments}`
                      : currentInstallment > 0
                      ? `${currentInstallment}ª`
                      : "—"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Descrição */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-xs font-semibold">Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Supermercado, Aluguel, Farmácia..."
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
              <FormLabel className="text-xs font-semibold">
                {isParcelado ? "Valor Total da Compra (R$)" : "Valor (R$)"}
              </FormLabel>
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
              {isParcelado && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Informe o valor total da compra. O sistema dividirá automaticamente entre as parcelas.
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
