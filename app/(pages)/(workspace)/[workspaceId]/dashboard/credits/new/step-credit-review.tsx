"use client"

import React from "react"
import { Calendar, Landmark, Receipt, Tag, User, Wallet } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UseFormReturn } from "react-hook-form"
import { formatCurrency } from "@/app/lib/utils"
import { Bank, Category, CreateCredit as CreateCreditProps, PersonResponsible } from "@/app/types/financial"
import { Badge } from "@/app/components/ui/badge"

interface StepCreditReviewProps {
  form: UseFormReturn<CreateCreditProps>
  categories: Category[]
  banks: Bank[]
  responsibles: PersonResponsible[]
}

export function StepCreditReview({
  form,
  categories,
  banks,
  responsibles,
}: StepCreditReviewProps) {
  const values = form.getValues()
  const creditType = values.type || "Comum"
  const isFixo = creditType === "Fixo"

  const selectedCategory = categories.find((c) => c.id === values.categoryId)
  const selectedBank = banks.find((b) => b.id === values.bankId)
  const selectedResponsible = responsibles.find((r) => r.id === values.responsibleId)

  const dateValue = values.date || values.startDate
  const formattedDate = dateValue
    ? format(new Date(dateValue), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Data não definida"

  const totalValue = values.value || 0

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-1">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Revisão da receita
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Confira as informações antes de confirmar o lançamento da receita.
        </p>
      </div>

      {/* Card de Resumo Principal */}
      <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-4 shadow-xs">
        {/* Top Header do Card com Tipo e Valor */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-semibold px-2.5 py-0.5">
              {creditType}
            </Badge>
            {isFixo && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-medium">
                Recorrente Mensal
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-muted-foreground">
              {isFixo ? "Valor Mensal da Entrada" : "Valor do Lançamento"}
            </span>
              <span className="text-2xl font-bold text-success tracking-tight">
              + {formatCurrency(totalValue)}
            </span>
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
                {isFixo ? "Data de Início" : "Data da Receita"}
              </span>
              <span className="text-foreground font-semibold">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <Wallet className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Forma de Entrada</span>
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
              <span className="text-muted-foreground font-medium">Banco / Conta</span>
              <span className="text-foreground font-semibold">
                {selectedBank ? selectedBank.name : "Não vinculado"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/20">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-muted-foreground font-medium">Responsável</span>
              <span className="text-foreground font-semibold">
                {selectedResponsible?.name || "Nenhum (Receita geral)"}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo do tipo Fixo se aplicável */}
        {isFixo && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Projeção:</span>
              <strong className="text-foreground font-semibold">
                Lançamentos mensais automáticos até o final do ano
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
