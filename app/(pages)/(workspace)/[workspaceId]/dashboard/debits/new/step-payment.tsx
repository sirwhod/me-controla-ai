"use client"

import React from "react"
import { CreditCard, Landmark, QrCode, User, Wallet } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form"
import { QuickCreateSelect } from "@/app/components/ui/quick-create-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { cn } from "@/app/lib/utils"
import { Bank, Category, CreditCard as CreditCardType, CreateDebit as CreateDebitProps, PersonResponsible } from "@/app/types/financial"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"

interface StepPaymentProps {
  form: UseFormReturn<CreateDebitProps>
  categories: Category[]
  banks: Bank[]
  cards: CreditCardType[]
  responsibles: PersonResponsible[]
  isCategoriesLoading?: boolean
  isBanksLoading?: boolean
  isCardsLoading?: boolean
  isResponsiblesLoading?: boolean
  onQuickCreateCategory: (name: string) => Promise<string | null>
  onQuickCreateBank: (name: string) => Promise<string | null>
  onQuickCreateResponsible: (name: string) => Promise<string | null>
}

const PAYMENT_METHODS = [
  { value: "Pix", label: "Pix", icon: <QrCode className="h-5 w-5" /> },
  { value: "Crédito", label: "Crédito", icon: <CreditCard className="h-5 w-5" /> },
  { value: "Débito", label: "Débito", icon: <CreditCard className="h-5 w-5" /> },
  { value: "Conta", label: "Conta", icon: <Wallet className="h-5 w-5" /> },
]

export function StepPayment({
  form,
  categories,
  banks,
  cards,
  responsibles,
  isCategoriesLoading,
  isBanksLoading,
  isCardsLoading,
  isResponsiblesLoading,
  onQuickCreateCategory,
  onQuickCreateBank,
  onQuickCreateResponsible,
}: StepPaymentProps) {
  const currentPaymentMethod = form.watch("paymentMethod")
  const responsibleId = form.watch("responsibleId")
  const isCreditPayment = currentPaymentMethod === "Crédito"

  const categoryItems = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon ? <DynamicIcon name={cat.icon as IconName} size={16} /> : undefined,
  }))

  const bankItems = banks.map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.iconUrl ? (
      <Image src={b.iconUrl} alt={b.name} width={16} height={16} className="rounded-xs" />
    ) : (
      <Landmark className="h-4 w-4 text-foreground" />
    ),
  }))

  const cardItems = cards.map((c) => ({
    id: c.id,
    name: `${c.name} ${c.bankName ? `(${c.bankName})` : ""}`,
    icon: <CreditCard className="h-4 w-4 text-primary" />,
  }))

  const responsibleItems = responsibles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: <User className="h-4 w-4 text-muted-foreground" />,
  }))

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Forma de pagamento e classificação
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Como você realizou este pagamento e a quem ele se refere?
        </p>
      </div>

      <div className="space-y-4 pt-1">
        {/* Métodos de Pagamento */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-xs font-semibold">Forma de Pagamento</FormLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Forma de Pagamento">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = field.value === method.value

                  return (
                    <button
                      key={method.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => {
                        field.onChange(method.value)
                        if (method.value === "Crédito") {
                          form.setValue("bankId", "")
                        } else {
                          form.setValue("creditCardId", "")
                        }
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 gap-1.5 cursor-pointer",
                        "bg-card/70 hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary",
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs text-foreground font-semibold"
                          : "border-border/70 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn("transition-colors", isSelected ? "text-primary" : "text-muted-foreground")}>
                        {method.icon}
                      </div>
                      <span className="text-xs">{method.label}</span>
                    </button>
                  )
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoria e Cartão/Banco em Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-xs font-semibold">Categoria</FormLabel>
                <FormControl>
                  <QuickCreateSelect
                    items={categoryItems}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione categoria..."
                    searchPlaceholder="Buscar ou criar categoria..."
                    createLabel="Criar categoria"
                    onCreateNew={onQuickCreateCategory}
                    disabled={isCategoriesLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isCreditPayment ? (
            <FormField
              control={form.control}
              name="creditCardId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-xs font-semibold">Cartão de Crédito</FormLabel>
                  <FormControl>
                    <QuickCreateSelect
                      items={cardItems}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val)
                        const selectedCard = cards.find((c) => c.id === val)
                        if (selectedCard?.bankId) {
                          form.setValue("bankId", selectedCard.bankId)
                        }
                      }}
                      placeholder="Selecione o cartão..."
                      searchPlaceholder="Buscar cartão..."
                      disabled={isCardsLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="bankId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-xs font-semibold">Banco / Conta</FormLabel>
                  <FormControl>
                    <QuickCreateSelect
                      items={bankItems}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione o banco..."
                      searchPlaceholder="Buscar ou criar banco..."
                      createLabel="Criar banco"
                      onCreateNew={onQuickCreateBank}
                      disabled={isBanksLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Responsável (opcional) */}
        <FormField
          control={form.control}
          name="responsibleId"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className="text-xs font-semibold">Responsável (opcional)</FormLabel>
              <FormControl>
                <QuickCreateSelect
                  items={responsibleItems}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione ou crie um responsável..."
                  searchPlaceholder="Buscar ou criar responsável..."
                  createLabel="Criar responsável"
                  onCreateNew={onQuickCreateResponsible}
                  disabled={isResponsiblesLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {responsibleId && (
          <FormField
            control={form.control}
            name="debtDirection"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel className="text-xs font-semibold">Quem deve reembolsar?</FormLabel>
                <Select value={field.value || "responsible_owes_me"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione quem deve reembolsar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="responsible_owes_me">A pessoa deve me reembolsar</SelectItem>
                    <SelectItem value="i_owe_responsible">Eu devo reembolsar a pessoa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  )
}
