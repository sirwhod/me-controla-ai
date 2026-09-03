"use client"

import React, { useState } from "react"
import { PageHeader } from "@/app/components/page-header"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard as CardIcon, Landmark, Loader2, Plus, Save, X, Calendar } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { QuickCreateSelect } from "@/app/components/ui/quick-create-select"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getBanks } from "@/app/http/banks/get-banks"
import { createBank } from "@/app/http/banks/create-bank"
import { createCard, updateCard } from "@/app/http/cards"
import {
  CreditCard,
  CreateCreditCard,
  createCreditCardSchema,
  Bank,
} from "@/app/types/financial"
import { cn } from "@/app/lib/utils"

const CARD_COLORS = [
  { label: "Roxo Nubank", value: "#820ad1" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Azul Escuro", value: "#1e3a8a" },
  { label: "Esmeralda", value: "#059669" },
  { label: "Grafite / Black", value: "#1e293b" },
  { label: "Dourado", value: "#d97706" },
  { label: "Rubi / Vermelho", value: "#e11d48" },
  { label: "Ciano", value: "#0891b2" },
]

interface CreditCardFormProps {
  mode: "create" | "edit"
  card?: CreditCard
}

export function CreditCardForm({ mode, card }: CreditCardFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const isEdit = mode === "edit"

  const initialLimitFormatted = card?.limit
    ? card.limit.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : ""

  const [rawLimitDisplay, setRawLimitDisplay] = useState(initialLimitFormatted)

  const form = useForm<CreateCreditCard>({
    resolver: zodResolver(createCreditCardSchema),
    defaultValues: {
      name: card?.name || "",
      bankId: card?.bankId || "",
      last4Digits: card?.last4Digits || "",
      limit: card?.limit || undefined,
      closingDay: card?.closingDay || 10,
      dueDay: card?.dueDay || 17,
      color: card?.color || "#6366f1",
    },
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    enabled: !!workspaceActive,
  })

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateCreditCard) =>
      createCard(workspaceActive!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", workspaceActive?.id] })
      toast.success("Cartão de crédito criado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/cards`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cadastrar cartão.")
    },
  })

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: CreateCreditCard) =>
      updateCard(workspaceActive!.id, card!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["card", workspaceActive?.id, card?.id] })
      toast.success("Cartão de crédito atualizado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/cards`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar cartão.")
    },
  })

  const isPending = isCreating || isUpdating

  const watchedName = form.watch("name") || "Nome do Cartão"
  const watchedLast4 = form.watch("last4Digits") || "••••"
  const watchedColor = form.watch("color") || "#6366f1"
  const watchedBankId = form.watch("bankId")
  const selectedBank = banks.find((b) => b.id === watchedBankId)

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) {
      setRawLimitDisplay("")
      form.setValue("limit", undefined, { shouldValidate: true })
      return
    }
    const num = Number(raw) / 100
    setRawLimitDisplay(
      num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
    form.setValue("limit", num, { shouldValidate: true })
  }

  const onSubmit = async (data: CreateCreditCard) => {
    if (!workspaceActive) return
    if (isEdit) {
      await updateMutation(data)
    } else {
      await createMutation(data)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/cards`)
  }

  return (
    <div className="space-y-6">
      {/* Live Preview do Cartão */}
      <div className="flex justify-center sm:justify-start">
        <div
          className="w-full max-w-sm h-48 rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden transition-all duration-300"
          style={{ backgroundColor: watchedColor }}
        >
          {/* Brilho e texturas de fundo */}
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -left-8 -top-8 w-32 h-32 rounded-full bg-black/10 blur-xl pointer-events-none" />

          {/* Topo do Cartão */}
          <div className="flex justify-between items-start z-10">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest font-semibold text-white/80">
                {selectedBank?.name || "Banco / Instituição"}
              </span>
              <span className="font-bold text-lg tracking-tight text-white drop-shadow-xs">
                {watchedName}
              </span>
            </div>
            <CardIcon className="h-7 w-7 text-white/90" />
          </div>

          {/* Chip do Cartão */}
          <div className="w-9 h-7 rounded-md bg-amber-300/80 border border-amber-400/50 shadow-inner z-10" />

          {/* Rodapé do Cartão */}
          <div className="flex justify-between items-end z-10">
            <div className="flex items-center gap-1.5 font-mono text-sm tracking-wider text-white/90">
              <span>••••</span>
              <span>••••</span>
              <span>••••</span>
              <span className="font-bold text-white">{watchedLast4 || "••••"}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-white/70 block">
                Vence dia
              </span>
              <span className="text-xs font-bold text-white">
                {form.watch("dueDay") || 17}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
        <div className="mb-6 pb-4 border-b border-border/60">
          <PageHeader title={isEdit ? "Editar Cartão de Crédito" : "Novo Cartão de Crédito"} icon={<CardIcon className="size-5 text-primary" aria-hidden="true" />} />
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isEdit
              ? "Atualize as informações, limites e datas de fechamento deste cartão."
              : "Cadastre um cartão de crédito para gerenciar compras parceladas e faturas."}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1: Identificação */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Identificação do Cartão
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome do Cartão */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Nome / Apelido do Cartão *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Nubank Roxinho, C6 Black..."
                          className="h-10 bg-background/80"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Banco Emissor */}
                <FormField
                  control={form.control}
                  name="bankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Banco Emissor</FormLabel>
                      <FormControl>
                        <QuickCreateSelect
                          items={banks.map((b) => ({
                            id: b.id,
                            name: b.name,
                            icon: <Landmark className="h-3.5 w-3.5 text-muted-foreground" />,
                          }))}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Selecione o banco emissor..."
                          createLabel="Cadastrar novo banco"
                          onCreateNew={async (name) => {
                            if (!workspaceActive) return null
                            const formData = new FormData()
                            formData.append("name", name)
                            formData.append("color", "#6366f1")
                            const res = await createBank({
                              workspaceId: workspaceActive.id,
                              payload: formData,
                            })
                            queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive.id] })
                            return res.bankId
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Últimos 4 Dígitos */}
                <FormField
                  control={form.control}
                  name="last4Digits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Últimos 4 Dígitos (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 1234"
                          maxLength={4}
                          className="h-10 bg-background/80 font-mono text-center tracking-widest"
                          value={field.value || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 4)
                            field.onChange(val)
                          }}
                        />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Facilita a identificação rápida em faturas e recibos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Seletor de Cor */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Cor de Destaque</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {CARD_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => field.onChange(c.value)}
                              title={c.label}
                              className={cn(
                                "h-8 w-8 rounded-full transition-transform border-2",
                                field.value === c.value
                                  ? "scale-110 border-primary ring-2 ring-primary/30"
                                  : "border-transparent hover:scale-105"
                              )}
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção 2: Financeiro & Fatura */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Limite & Ciclo da Fatura
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Limite Total */}
                <FormField
                  control={form.control}
                  name="limit"
                  render={() => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="text-xs font-semibold">Limite Total (Opcional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            R$
                          </span>
                          <Input
                            placeholder="0,00"
                            value={rawLimitDisplay}
                            onChange={handleLimitChange}
                            className="pl-9 h-10 bg-background/80 font-bold"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dia de Fechamento */}
                <FormField
                  control={form.control}
                  name="closingDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Dia de Fechamento *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 10"
                            className="pl-9 h-10 bg-background/80"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Dia que a fatura fecha.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dia de Vencimento */}
                <FormField
                  control={form.control}
                  name="dueDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Dia de Vencimento *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            placeholder="Ex: 17"
                            className="pl-9 h-10 bg-background/80"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Dia limite para pagamento.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                className="h-10 text-xs gap-1.5"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isPending}
                className="h-10 text-xs font-semibold gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isEdit ? "Salvar Alterações" : "Cadastrar Cartão"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
