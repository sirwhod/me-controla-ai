"use client"

import React, { useState } from "react"
import { PageHeader } from "@/app/components/page-header"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Plus, Save, Target, X } from "lucide-react"

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
import { Textarea } from "@/app/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { createGoal } from "@/app/http/goals/create-goal"
import { updateGoal } from "@/app/http/goals/update-goal"
import {
  Goal,
  CreateGoal as CreateGoalProps,
  createGoalSchema,
  UpdateGoal as UpdateGoalProps,
} from "@/app/types/financial"
import { cn, formatCurrency } from "@/app/lib/utils"

interface GoalFormProps {
  mode: "create" | "edit"
  goal?: Goal
}

export function GoalForm({ mode, goal }: GoalFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const isEdit = mode === "edit"

  const initialTargetFormatted = (goal?.targetAmount || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const [rawTargetDisplay, setRawTargetDisplay] = useState(
    goal?.targetAmount ? initialTargetFormatted : ""
  )

  const form = useForm<CreateGoalProps>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: goal?.name || "",
      targetAmount: goal?.targetAmount || 0,
      description: goal?.description || "",
      startDate: goal?.startDate
        ? new Date(goal.startDate).toISOString()
        : new Date().toISOString(),
      endDate: goal?.endDate ? new Date(goal.endDate).toISOString() : "",
    },
  })

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateGoalProps) =>
      createGoal({
        workspaceId: workspaceActive!.id,
        ...data,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceActive?.id] })
      toast.success(res?.message || "Meta financeira criada com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/goals`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar meta.")
    },
  })

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateGoalProps) =>
      updateGoal(workspaceActive!.id, goal!.id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["goals", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["goal", workspaceActive?.id, goal?.id] })
      toast.success(res?.message || "Meta financeira atualizada com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/goals`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar meta.")
    },
  })

  const isPending = isCreating || isUpdating

  const watchedTarget = form.watch("targetAmount") || 0
  const watchedCurrent = goal?.currentAmount || 0
  const progressPercentage = watchedTarget > 0 ? Math.min(100, Math.round((watchedCurrent / watchedTarget) * 100)) : 0

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) {
      setRawTargetDisplay("")
      form.setValue("targetAmount", 0, { shouldValidate: true })
      return
    }
    const num = Number(raw) / 100
    setRawTargetDisplay(
      num.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    )
    form.setValue("targetAmount", num, { shouldValidate: true })
  }

  const onSubmit = async (data: CreateGoalProps) => {
    if (!workspaceActive) return
    if (isEdit) {
      await updateMutation(data)
    } else {
      await createMutation(data)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/goals`)
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60">
        <PageHeader title={isEdit ? "Editar Meta Financeira" : "Nova Meta Financeira"} icon={<Target className="size-5 text-primary" aria-hidden="true" />} />
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isEdit
            ? "Ajuste os valores, prazo e detalhes para alcançar este objetivo."
            : "Defina um objetivo financeiro claro e acompanhe seu progresso de economia."}
        </p>
      </div>

      {/* Card de Progresso Visual */}
      {watchedTarget > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-foreground">
              {form.watch("name") || "Nova Meta"}
            </span>
            <span className="font-bold text-primary">{progressPercentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>Acumulado: {formatCurrency(watchedCurrent)}</span>
            <span>Objetivo: {formatCurrency(watchedTarget)}</span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome da Meta */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Nome da Meta / Objetivo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Reserva de Emergência, Viagem de Férias, Carro Novo..."
                    className="h-10 bg-background/80"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Valor Alvo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="targetAmount"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Valor Alvo da Meta *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">
                        R$
                      </span>
                      <Input
                        placeholder="0,00"
                        value={rawTargetDisplay}
                        onChange={handleTargetChange}
                        className="pl-11 h-10 text-base font-bold bg-background/80"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px]">
                    O montante total que você deseja alcançar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data Limite / Prazo */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between">
                  <FormLabel className="text-xs font-semibold">Data Limite / Prazo (Opcional)</FormLabel>
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
                            <span>Sem prazo definido</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const safeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
                            field.onChange(safeDate.toISOString())
                          } else {
                            field.onChange("")
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        captionLayout="dropdown"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-[11px]">
                    Data estimada para concluir a meta.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Descrição / Notas */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Descrição / Observações (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Adicione detalhes, motivações ou planos para esta meta..."
                    className="min-h-24 bg-background/80 resize-y"
                    value={field.value || ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {isEdit ? "Salvar Alterações" : "Criar Meta"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
