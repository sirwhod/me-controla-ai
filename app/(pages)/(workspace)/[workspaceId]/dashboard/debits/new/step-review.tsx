"use client"

import React from "react"
import { Calendar, CreditCard, Landmark, Receipt, Tag, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UseFormReturn } from "react-hook-form"
import { formatCurrency } from "@/app/lib/utils"
import { Bank, Category, CreditCard as CreditCardType, CreateDebit as CreateDebitProps, PersonResponsible } from "@/app/types/financial"
import { Badge } from "@/app/components/ui/badge"

interface StepReviewProps {
  form: UseFormReturn<CreateDebitProps>
  categories: Category[]
  banks: Bank[]
  cards: CreditCardType[]
  responsibles: PersonResponsible[]
}

export function StepReview({
  form,
  categories,
  banks,
  cards,
  responsibles,
}: StepReviewProps) {
  const values = form.getValues()
  const debitType = values.type || "Comum"
  const isParcelado = debitType === "Parcelamento"

  const selectedCategory = categories.find((c) => c.id === values.categoryId)
  const selectedCard = cards.find((c) => c.id === values.creditCardId)
  const selectedBank = banks.find((b) => b.id === values.bankId)
  const selectedResponsible = responsibles.find((r) => r.id === values.responsibleId)

  const dateValue = values.date || values.startDate
  const formattedDate = dateValue
    ? format(new Date(dateValue), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data não definida"

  const totalValue = values.value || 0
  const totalInstallments = values.totalInstallments || 2
  const currentInstallment = values.currentInstallment || 1
  const installmentApprox = totalInstallments > 0 ? totalValue / totalInstallments : 0

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Revisão da despesa
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Confira as informações antes de confirmar a criação.
        </p>
      </div>

      {/* Card de Resumo Principal */}
      <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-4 shadow-xs">
        {/* Top Header do Card com Tipo e Valor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-semibold px-2.5 py-0.5">
              {debitType}
            </Badge>
            {isParcelado && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-medium">
                {totalInstallments}x Parcelas
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-muted-foreground">
              {isParcelado ? "Valor Total" : "Valor do Lançamento"}
            </span>
            <span className="text-2xl font-bold text-rose-500 tracking-tight">
              {formatCurrency(totalValue)}
            </span>
            {isParcelado && (
              <span className="text-xs font-semibold text-primary">
                {totalInstallments}x de ~{formatCurrency(installmentApprox)}
              </span>
            )}
          </div>
        </div>

        {/* Linhas de Detalhes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <Receipt className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Descrição</span>
              <span className="text-foreground font-semibold text-sm">
                {values.description || "Sem descrição"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">
                {isParcelado ? "Data da 1ª Parcela / Compra" : "Data da Despesa"}
              </span>
              <span className="text-foreground font-semibold">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Forma de Pagamento</span>
              <span className="text-foreground font-semibold">
                {values.paymentMethod || "Não definida"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Categoria</span>
              <span className="text-foreground font-semibold">
                {selectedCategory?.name || "Sem categoria"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <Landmark className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">
                {selectedCard ? "Cartão de Crédito" : "Banco / Conta"}
              </span>
              <span className="text-foreground font-semibold">
                {selectedCard ? selectedCard.name : selectedBank ? selectedBank.name : "Não vinculado"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Responsável</span>
              <span className="text-foreground font-semibold">
                {selectedResponsible?.name || "Nenhum (Despesa geral)"}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo do Parcelamento se aplicável */}
        {isParcelado && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Parcela Deste Mês:</span>
              <strong className="text-foreground font-semibold">
                {currentInstallment}ª de {totalInstallments}
              </strong>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Projeção de Parcelas:</span>
              <strong className="text-foreground font-semibold">
                {totalInstallments} meses consecutivos
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
