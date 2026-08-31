"use client"

import React, { useState } from "react"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Save, X, Landmark, Tag, User, CheckCircle2, Clock } from "lucide-react"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { QuickCreateSelect } from "@/app/components/ui/quick-create-select"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { getCategories } from "@/app/http/categories/get-categories"
import { createCategory } from "@/app/http/categories/create-category"
import { getBanks } from "@/app/http/banks/get-banks"
import { createBank } from "@/app/http/banks/create-bank"
import { getResponsibles, createResponsible } from "@/app/http/responsibles"
import { updateCredit } from "@/app/http/credits/update-credit"
import {
  Credit,
  UpdateCredit as UpdateCreditProps,
  updateCreditSchema,
  Category,
  Bank,
  PersonResponsible,
} from "@/app/types/financial"
import { invalidateFinancialQueries } from "@/app/lib/invalidate-financial-queries"
import { cn } from "@/app/lib/utils"

interface EditCreditFormProps {
  credit: Credit
}

export function EditCreditForm({ credit }: EditCreditFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  // Format initial value as BRL display string
  const initialValueFormatted = (credit.value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [rawDisplayValue, setRawDisplayValue] = useState(initialValueFormatted)

  const form = useForm<UpdateCreditProps>({
    resolver: zodResolver(updateCreditSchema),
    defaultValues: {
      description: credit.description || "",
      value: credit.value || 0,
      date: credit.date ? new Date(credit.date).toISOString() : new Date().toISOString(),
      bankId: credit.bankId || null,
      categoryId: credit.categoryId || null,
      responsibleId: credit.responsibleId || null,
      paymentMethod: credit.paymentMethod || "Pix",
      status: credit.status || "received",
    },
  })

  // Queries para dados relacionais
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    enabled: !!workspaceActive,
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    enabled: !!workspaceActive,
  })

  const { data: responsibles = [] } = useQuery<PersonResponsible[]>({
    queryKey: ["responsibles", workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    enabled: !!workspaceActive,
  })

  const { mutateAsync: updateCreditMutation, isPending } = useMutation({
    mutationFn: (data: UpdateCreditProps) =>
      updateCredit(workspaceActive!.id, credit.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credits", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["credit", workspaceActive?.id, credit.id] })
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      void invalidateFinancialQueries(queryClient, workspaceActive?.id)
      toast.success("Receita atualizada com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard/credits`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar alterações da receita.")
    },
  })

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) {
      setRawDisplayValue("")
      form.setValue("value", 0, { shouldValidate: true })
      return
    }
    const num = Number(raw) / 100
    setRawDisplayValue(
      num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
    form.setValue("value", num, { shouldValidate: true })
  }

  const onSubmit = async (data: UpdateCreditProps) => {
    if (!workspaceActive) return
    await updateCreditMutation(data)
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/dashboard/credits`)
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Editar Receita
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Atualize os valores, forma de recebimento e classificações desta receita.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção 1: Informações Principais */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Detalhes Financeiros
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data da Receita */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel className="text-xs font-semibold">Data da Receita *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10 bg-background/80",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
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
                              field.onChange(safeDate.toISOString())
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

              {/* Valor */}
              <FormField
                control={form.control}
                name="value"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Valor da Receita *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          R$
                        </span>
                        <Input
                          placeholder="0,00"
                          value={rawDisplayValue}
                          onChange={handleCurrencyChange}
                          className="pl-11 h-10 text-base font-bold bg-background/80"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Descrição do Lançamento *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Salário, Freelance, Venda..."
                      className="h-10 bg-background/80"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seção 2: Destino & Forma de Recebimento */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Destino & Forma de Entrada
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Forma de Recebimento */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Forma de Entrada *</FormLabel>
                    <Select value={field.value || "Pix"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background/80">
                          <SelectValue placeholder="Selecione a forma..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pix">⚡ Pix</SelectItem>
                        <SelectItem value="Conta">🏛️ Transferência / Conta</SelectItem>
                        <SelectItem value="Débito">💳 Débito</SelectItem>
                        <SelectItem value="Crédito">💳 Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Status do Recebimento</FormLabel>
                    <Select value={field.value || "received"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background/80">
                          <SelectValue placeholder="Status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="received">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Recebido / Confirmado
                          </span>
                        </SelectItem>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Pendente / A Receber
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Categoria */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Categoria</FormLabel>
                    <FormControl>
                      <QuickCreateSelect
                        items={categories.map((c) => ({
                          id: c.id,
                          name: c.name,
                          icon: <Tag className="h-3.5 w-3.5 text-muted-foreground" />,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Selecione a categoria..."
                        createLabel="Criar nova categoria"
                        onCreateNew={async (name) => {
                          if (!workspaceActive) return null
                          const res = await createCategory({
                            workspaceId: workspaceActive.id,
                            name,
                            type: "income",
                            icon: "wallet",
                          })
                          queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive.id] })
                          return res.categoryId
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banco / Conta */}
              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Banco / Conta Destino</FormLabel>
                    <FormControl>
                      <QuickCreateSelect
                        items={banks.map((b) => ({
                          id: b.id,
                          name: b.name,
                          icon: <Landmark className="h-3.5 w-3.5 text-muted-foreground" />,
                        }))}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Selecione o banco de destino..."
                        createLabel="Criar novo banco"
                        onCreateNew={async (name) => {
                          if (!workspaceActive) return null
                          const formData = new FormData()
                          formData.append("name", name)
                          formData.append("color", "#10b981")
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

            {/* Responsável */}
            <FormField
              control={form.control}
              name="responsibleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Pessoa Responsável (Opcional)</FormLabel>
                  <FormControl>
                    <QuickCreateSelect
                      items={responsibles.map((r) => ({
                        id: r.id,
                        name: r.name,
                        icon: <User className="h-3.5 w-3.5 text-muted-foreground" />,
                      }))}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Nenhum responsável vinculado..."
                      createLabel="Cadastrar nova pessoa"
                      onCreateNew={async (name) => {
                        if (!workspaceActive) return null
                        const res = await createResponsible(workspaceActive.id, { name })
                        queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive.id] })
                        return res.responsibleId
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    Associe esta receita a uma pessoa para histórico ou acertos futuros.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
