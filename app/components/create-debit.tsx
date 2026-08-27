"use client"

import { BanknoteArrowDown, CalendarIcon, CalendarSync, CreditCard, Landmark, Pin, PlusCircle, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { useForm } from "react-hook-form"
import { Debit, CreateDebit as CreateDebitProps, createDebitSchema, Bank, Category, CreditCard as CreditCardType, PersonResponsible } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createDebit } from "../http/debits/create-debit"
import { useWorkspace } from "../hooks/use-workspace"
import { getDebits } from "../http/debits/get-debits"
import { useEffect, useState } from "react" 
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { getBanks } from "../http/banks/get-banks"
import { createBank } from "../http/banks/create-bank"
import { getCategories } from "../http/categories/get-categories"
import { createCategory } from "../http/categories/create-category"
import { getCards } from "../http/cards"
import { getResponsibles, createResponsible } from "../http/responsibles"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "./ui/calendar"
import { QuickCreateSelect } from "./ui/quick-create-select"

type CreateDebitFormData = CreateDebitProps

interface CreateDebitComponentProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function CreateDebit({ className, fullWidth, label = "Nova Despesa" }: CreateDebitComponentProps = {}) {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateDebitFormData>({
    resolver: zodResolver(createDebitSchema),
    defaultValues: {
      description: "",
      date: new Date().toISOString(),
      startDate: new Date().toISOString(),
      frequency: "monthly",
      bankId: "",
      creditCardId: "",
      categoryId: "",
      responsibleId: "",
      paymentMethod: "Pix",
      proofUrl: "",
    },
  })

  const { mutateAsync: createDebitFn } = useMutation({
    mutationFn: createDebit
  })

  const { refetch } = useQuery<Debit[], Error>({
    queryKey: ['debits', workspaceActive?.id],
    queryFn: () => getDebits(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: banks = [], isLoading: isBanksLoading } = useQuery<Bank[], Error>({
    queryKey: ['banks', workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[], Error>({
    queryKey: ['categories', workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: cards = [], isLoading: isCardsLoading } = useQuery<CreditCardType[], Error>({
    queryKey: ['cards', workspaceActive?.id],
    queryFn: () => getCards(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: responsibles = [], isLoading: isResponsiblesLoading } = useQuery<PersonResponsible[], Error>({
    queryKey: ['responsibles', workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const handleQuickCreateCategory = async (name: string) => {
    if (!workspaceActive) return null
    try {
      const res = await createCategory({
        workspaceId: workspaceActive.id,
        name,
        type: 'all',
        icon: 'tag' as IconName,
      })
      await queryClient.invalidateQueries({ queryKey: ['categories', workspaceActive.id] })
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
      await queryClient.invalidateQueries({ queryKey: ['banks', workspaceActive.id] })
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
      const res = await createResponsible(workspaceActive.id, {
        name,
      })
      await queryClient.invalidateQueries({ queryKey: ['responsibles', workspaceActive.id] })
      toast.success(`Responsável "${name}" cadastrado com sucesso!`)
      return res.responsibleId
    } catch {
      toast.error("Erro ao cadastrar responsável.")
      return null
    }
  }

  async function handleCreateDebitSubmit(data: CreateDebitProps) {
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Caixinha não está pronta. Tente novamente.")
      return
    }

    try {
      const payload: CreateDebitProps = {
        ...data,
        frequency: data.frequency || "monthly",
        startDate: data.startDate || data.date || new Date().toISOString(),
        date: data.date || data.startDate || new Date().toISOString(),
      }

      const response = await createDebitFn({
        workspaceId: workspaceActive.id,
        ...payload
      })

      if (response) {
        await queryClient.invalidateQueries({ queryKey: ['debits', workspaceActive.id] })
        refetch()
        toast.success(response.message || "Despesa criada com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar nova despesa: ${errMessage}`)
    }
  }

  const handleModalOpenChange = (open: boolean) => {
    setModalIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  useEffect(() => {
    if (modalIsOpen) {
      form.setValue("date", new Date().toISOString())
    }
  }, [modalIsOpen, form])

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
    name: `${c.name} ${c.bankName ? `(${c.bankName})` : ''}`,
    icon: <CreditCard className="h-4 w-4 text-primary" />,
  }))

  const responsibleItems = responsibles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: <User className="h-4 w-4 text-muted-foreground" />,
  }))

  const isCreditPayment = form.watch("paymentMethod") === "Crédito"

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={() => setModalIsOpen(true)}
          variant="default"
          className={cn(fullWidth && "w-full", className)}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Nova Despesa</DialogTitle>
          <DialogDescription>
            Adicione uma nova despesa para registrar seus gastos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateDebitSubmit)} className="space-y-4">
            {!form.watch("type") && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Despesa</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 md:grid-cols-4 w-full gap-2"
                      >
                        <div>
                          <RadioGroupItem value="Comum" id="Comum" className="peer sr-only" />
                          <Label
                            htmlFor="Comum"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <BanknoteArrowDown className="mb-2 h-5 w-5 text-rose-500" />
                            <span className="text-xs font-medium">Comum</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="Fixo" id="Fixo" className="peer sr-only" />
                          <Label
                            htmlFor="Fixo"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <Pin className="mb-2 h-5 w-5 text-amber-500" />
                            <span className="text-xs font-medium">Fixo</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="Assinatura" id="Assinatura" className="peer sr-only" />
                          <Label
                            htmlFor="Assinatura"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <CalendarSync className="mb-2 h-5 w-5 text-blue-500" />
                            <span className="text-xs font-medium">Assinatura</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="Parcelamento" id="Parcelamento" className="peer sr-only" />
                          <Label
                            htmlFor="Parcelamento"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                          >
                            <CreditCard className="mb-2 h-5 w-5 text-purple-500" />
                            <span className="text-xs font-medium">Parcelado</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "Comum" && (
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Despesa</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                          onSelect={date => {
                            field.onChange(date ? date.toISOString() : '')
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(form.watch("type") === "Fixo" || form.watch("type") === "Assinatura" || form.watch("type") === "Parcelamento") && (
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                          onSelect={date => {
                            field.onChange(date ? date.toISOString() : '')
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("type") === "Parcelamento" && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <FormField
                  control={form.control}
                  name="totalInstallments"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Total de Parcelas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="12"
                          {...field}
                          value={field.value ?? 2}
                          onChange={e => field.onChange(Number(e.target.value) || 2)}
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
                      <FormLabel>Parcela Atual (1 a N)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          placeholder="1"
                          {...field}
                          value={field.value ?? 1}
                          onChange={e => field.onChange(Number(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {form.watch("type") && (
              <>
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Supermercado, Aluguel..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="R$ 0,00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val)
                            if (val === "Crédito") {
                              form.setValue("bankId", "")
                            } else {
                              form.setValue("creditCardId", "")
                            }
                          }}
                          className="grid grid-cols-2 sm:grid-cols-4 w-full gap-2"
                        >
                          <div>
                            <RadioGroupItem value="Pix" id="debit-pix" className="peer sr-only" />
                            <Label
                              htmlFor="debit-pix"
                              className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="text-xs font-medium">Pix</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="Crédito" id="debit-credito" className="peer sr-only" />
                            <Label
                              htmlFor="debit-credito"
                              className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="text-xs font-medium">Crédito</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="Débito" id="debit-debito" className="peer sr-only" />
                            <Label
                              htmlFor="debit-debito"
                              className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="text-xs font-medium">Débito</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem value="Conta" id="debit-conta" className="peer sr-only" />
                            <Label
                              htmlFor="debit-conta"
                              className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <span className="text-xs font-medium">Conta</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <QuickCreateSelect
                            items={categoryItems}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Selecione categoria..."
                            searchPlaceholder="Buscar ou criar categoria..."
                            createLabel="Criar categoria"
                            onCreateNew={handleQuickCreateCategory}
                            disabled={isCategoriesLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Seleciona Cartão de Crédito se Crédito, ou Banco se outro método */}
                  {isCreditPayment ? (
                    <FormField
                      control={form.control}
                      name="creditCardId"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Cartão de Crédito</FormLabel>
                          <FormControl>
                            <QuickCreateSelect
                              items={cardItems}
                              value={field.value}
                              onChange={(val) => {
                                field.onChange(val)
                                const selectedCard = cards.find(c => c.id === val)
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
                          <FormLabel>Banco / Conta</FormLabel>
                          <FormControl>
                            <QuickCreateSelect
                              items={bankItems}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione o banco..."
                              searchPlaceholder="Buscar ou criar banco..."
                              createLabel="Criar banco"
                              onCreateNew={handleQuickCreateBank}
                              disabled={isBanksLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Campo de Responsável com QuickCreate */}
                <FormField
                  control={form.control}
                  name="responsibleId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Responsável (opcional)</FormLabel>
                      <FormControl>
                        <QuickCreateSelect
                          items={responsibleItems}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione ou crie um responsável..."
                          searchPlaceholder="Buscar ou criar responsável..."
                          createLabel="Criar responsável"
                          onCreateNew={handleQuickCreateResponsible}
                          disabled={isResponsiblesLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter className="justify-between pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Criar Despesa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}