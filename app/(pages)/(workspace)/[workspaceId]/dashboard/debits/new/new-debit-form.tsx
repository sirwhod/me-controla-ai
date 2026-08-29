"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/app/components/ui/button"
import { Form } from "@/app/components/ui/form"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { useDateFilter } from "@/app/contexts/date-filter-context"
import { getBanks } from "@/app/http/banks/get-banks"
import { createBank } from "@/app/http/banks/create-bank"
import { getCategories } from "@/app/http/categories/get-categories"
import { createCategory } from "@/app/http/categories/create-category"
import { getCards } from "@/app/http/cards"
import { getResponsibles, createResponsible } from "@/app/http/responsibles"
import { createDebit } from "@/app/http/debits/create-debit"
import {
  Bank,
  Category,
  CreditCard as CreditCardType,
  CreateDebit as CreateDebitProps,
  createDebitSchema,
  PersonResponsible,
  TypeDebit,
  Debit,
} from "@/app/types/financial"
import { IconName } from "lucide-react/dynamic"

import { ExpenseStepper, StepItem } from "./expense-stepper"
import { StepType } from "./step-type"
import { StepDetails } from "./step-details"
import { StepPayment } from "./step-payment"
import { StepReview } from "./step-review"

const STEPS: StepItem[] = [
  { number: 1, title: "Tipo" },
  { number: 2, title: "Detalhes" },
  { number: 3, title: "Pagamento" },
  { number: 4, title: "Revisão" },
]

export function NewDebitForm() {
  const router = useRouter()
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const { monthIndex, year } = useDateFilter()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState<number>(1)

  const form = useForm<CreateDebitProps>({
    resolver: zodResolver(createDebitSchema),
    mode: "onChange",
    defaultValues: {
      type: "Comum",
      description: "",
      value: undefined,
      date: new Date().toISOString(),
      startDate: new Date().toISOString(),
      frequency: "monthly",
      totalInstallments: undefined,
      currentInstallment: undefined,
      bankId: "",
      creditCardId: "",
      categoryId: "",
      responsibleId: "",
      paymentMethod: "Pix",
    },
  })

  // Inicializa data com base no mês/ano ativo
  useEffect(() => {
    const now = new Date()
    const isCurrentMonthAndYear = now.getMonth() === monthIndex && now.getFullYear() === year
    const initialDay = isCurrentMonthAndYear ? now.getDate() : 1
    const initialDate = new Date(year, monthIndex, initialDay, 12, 0, 0).toISOString()
    form.setValue("date", initialDate)
    form.setValue("startDate", initialDate)
  }, [monthIndex, year, form])

  // Queries para dados relacionais
  const { data: banks = [], isLoading: isBanksLoading } = useQuery<Bank[], Error>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[], Error>({
    queryKey: ["categories", workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: cards = [], isLoading: isCardsLoading } = useQuery<CreditCardType[], Error>({
    queryKey: ["cards", workspaceActive?.id],
    queryFn: () => getCards(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: responsibles = [], isLoading: isResponsiblesLoading } = useQuery<PersonResponsible[], Error>({
    queryKey: ["responsibles", workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  // Quick creates
  const handleQuickCreateCategory = async (name: string) => {
    if (!workspaceActive) return null
    try {
      const res = await createCategory({
        workspaceId: workspaceActive.id,
        name,
        type: "expense",
        icon: "tag" as IconName,
      })
      await queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive.id] })
      toast.success(`Categoria "${name}" criada com sucesso!`)
      return res.categoryId
    } catch {
      toast.error("Erro ao criar categoria.")
      return null
    }
  }

  const handleQuickCreateBank = async (name: string) => {
    if (!workspaceActive) return null
    try {
      const formData = new FormData()
      formData.append("name", name)
      const res = await createBank({
        workspaceId: workspaceActive.id,
        payload: formData,
      })
      await queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive.id] })
      toast.success(`Banco "${name}" criado com sucesso!`)
      return res.bankId
    } catch {
      toast.error("Erro ao criar banco.")
      return null
    }
  }

  const handleQuickCreateResponsible = async (name: string) => {
    if (!workspaceActive) return null
    try {
      const res = await createResponsible(workspaceActive.id, { name })
      await queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive.id] })
      toast.success(`Responsável "${name}" cadastrado com sucesso!`)
      return res.responsibleId
    } catch {
      toast.error("Erro ao cadastrar responsável.")
      return null
    }
  }

  const { mutateAsync: createDebitFn, isPending: isSubmitting } = useMutation({
    mutationFn: createDebit,
  })

  // Validação por etapa para avançar
  const handleNextStep = async () => {
    if (currentStep === 1) {
      const type = form.getValues("type")
      if (!type) {
        toast.error("Selecione um tipo de despesa para continuar.")
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      const type = form.getValues("type")
      const isParcelado = type === "Parcelamento"

      const fieldsToValidate: Array<keyof CreateDebitProps> = ["description", "value"]
      if (isParcelado) {
        fieldsToValidate.push("totalInstallments", "currentInstallment", "startDate")
      } else {
        fieldsToValidate.push("date")
      }

      const isValid = await form.trigger(fieldsToValidate)
      if (!isValid) {
        toast.error("Por favor, preencha todos os campos obrigatórios corretamente.")
        return
      }

      const val = form.getValues("value")
      if (!val || val <= 0) {
        form.setError("value", { message: "Informe um valor positivo." })
        toast.error("Informe um valor válido maior que zero.")
        return
      }

      if (isParcelado) {
        const total = form.getValues("totalInstallments")
        const cur = form.getValues("currentInstallment")
        if (!total || isNaN(total) || total < 2) {
          form.setError("totalInstallments", { message: "Informe um total de no mínimo 2 parcelas." })
          toast.error("Informe um total de pelo menos 2 parcelas.")
          return
        }
        if (!cur || isNaN(cur) || cur < 1) {
          form.setError("currentInstallment", { message: "Informe a parcela deste mês (mínimo 1)." })
          toast.error("Informe a parcela deste mês.")
          return
        }
        if (cur > total) {
          form.setError("currentInstallment", { message: `A parcela atual não pode ser maior que o total (${total}).` })
          toast.error(`A parcela atual deve ser entre 1 e ${total}.`)
          return
        }
      }

      setCurrentStep(3)
      return
    }

    if (currentStep === 3) {
      const paymentMethod = form.getValues("paymentMethod")

      if (!paymentMethod) {
        toast.error("Selecione a forma de pagamento.")
        return
      }

      if (paymentMethod === "Crédito") {
        const cardId = form.getValues("creditCardId")
        if (!cardId) {
          form.setError("creditCardId", { message: "Selecione o cartão de crédito." })
          toast.error("Selecione um cartão de crédito para a despesa.")
          return
        }
      }

      setCurrentStep(4)
      return
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    } else {
      router.push(`/${workspaceActive?.id}/dashboard/debits`)
    }
  }

  // Prevenir submit involuntário nos steps 1, 2 e 3
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < 4) {
      handleNextStep()
    } else {
      form.handleSubmit(onSubmit)(e)
    }
  }

  // Submissão Final
  const onSubmit = async (data: CreateDebitProps) => {
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Caixinha não está pronta. Tente novamente.")
      return
    }

    try {
      const isParcelamento = data.type === "Parcelamento"
      const payload: CreateDebitProps = {
        ...data,
        paymentMethod: isParcelamento ? "Crédito" : data.paymentMethod || "Pix",
        frequency: data.frequency || "monthly",
        startDate: data.startDate || data.date || new Date().toISOString(),
        date: data.date || data.startDate || new Date().toISOString(),
        // Limpar campos residuais se não for parcelamento
        totalInstallments: isParcelamento ? data.totalInstallments : undefined,
        currentInstallment: isParcelamento ? data.currentInstallment : undefined,
        // Limpar cartão se não for crédito
        creditCardId: isParcelamento || data.paymentMethod === "Crédito" ? data.creditCardId : null,
      }

      const response = await createDebitFn({
        workspaceId: workspaceActive.id,
        ...payload,
      })

      if (response) {
        if (payload.type === "Comum" && response.debitId) {
          const date = new Date(payload.date || new Date().toISOString())
          const month = date.toLocaleString("pt-BR", { month: "long" })
          const optimisticDebit = {
            ...payload,
            id: response.debitId,
            workspaceId: workspaceActive.id,
            month,
            year: date.getFullYear(),
            date,
          } as unknown as Debit
          queryClient.setQueryData<Debit[]>(
            ["debits", workspaceActive.id, month, String(date.getFullYear())],
            (cached) => cached ? [optimisticDebit, ...cached] : [optimisticDebit]
          )
        } else {
          await queryClient.invalidateQueries({ queryKey: ["debits", workspaceActive.id] })
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["analytics-summary", workspaceActive.id] }),
          queryClient.invalidateQueries({ queryKey: ["annual-summary", workspaceActive.id] }),
        ])
        toast.success(response.message || "Despesa criada com sucesso!")
        router.push(`/${workspaceActive.id}/dashboard/debits`)
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro ao criar a despesa."
      toast.error(`Erro ao salvar despesa: ${errMessage}`)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Stepper Superior */}
      <ExpenseStepper
        currentStep={currentStep}
        steps={STEPS}
        onStepClick={(step) => {
          if (step < currentStep) {
            setCurrentStep(step)
          }
        }}
      />

      {/* Form Container */}
      <Form {...form}>
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-7 backdrop-blur-xs shadow-xs">
            {currentStep === 1 && (
              <StepType
                selectedType={form.watch("type")}
                onSelectType={(type: TypeDebit) => {
                  form.setValue("type", type)
                  if (type === "Parcelamento") {
                    form.setValue("paymentMethod", "Crédito")
                    form.setValue("bankId", "")
                  }
                }}
              />
            )}

            {currentStep === 2 && <StepDetails form={form} />}

            {currentStep === 3 && (
              <StepPayment
                form={form}
                categories={categories}
                banks={banks}
                cards={cards}
                responsibles={responsibles}
                isCategoriesLoading={isCategoriesLoading}
                isBanksLoading={isBanksLoading}
                isCardsLoading={isCardsLoading}
                isResponsiblesLoading={isResponsiblesLoading}
                onQuickCreateCategory={handleQuickCreateCategory}
                onQuickCreateBank={handleQuickCreateBank}
                onQuickCreateResponsible={handleQuickCreateResponsible}
              />
            )}

            {currentStep === 4 && (
              <StepReview
                form={form}
                categories={categories}
                banks={banks}
                cards={cards}
                responsibles={responsibles}
              />
            )}
          </div>

          {/* Botões de Ação do Stepper */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isSubmitting}
              className="gap-2 h-11 px-5 border-border/80 text-xs sm:text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? "Cancelar" : "Voltar e editar"}
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="gap-2 h-11 px-6 text-xs sm:text-sm font-semibold shadow-xs"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 h-11 px-7 text-xs sm:text-sm font-bold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Criar Despesa
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}
