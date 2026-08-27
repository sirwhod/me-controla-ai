"use client"

import { Banknote, CalendarIcon, CreditCard, Landmark, PlusCircle, User } from "lucide-react"
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
import { Credit, CreateCredit as CreateCreditProps, createCreditSchema, Bank, Category, PersonResponsible } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createCredit } from "../http/credits/create-credit"
import { useWorkspace } from "../hooks/use-workspace"
import { getCredits } from "../http/credits/get-credits"
import { useEffect, useState } from "react" 
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { getBanks } from "../http/banks/get-banks"
import { createBank } from "../http/banks/create-bank"
import { getCategories } from "../http/categories/get-categories"
import { createCategory } from "../http/categories/create-category"
import { getResponsibles, createResponsible } from "../http/responsibles"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { Calendar } from "./ui/calendar"
import { QuickCreateSelect } from "./ui/quick-create-select"

type CreateCreditFormData = CreateCreditProps

export function CreateCredit() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const form = useForm<CreateCreditFormData>({
    resolver: zodResolver(createCreditSchema),
    defaultValues: {
      description: "",
      date: new Date().toISOString(),
      bankId: "",
      categoryId: "",
      responsibleId: "",
      paymentMethod: "Pix",
      proofUrl: "",
      status: "received",
    },
  })

  const { mutateAsync: createCreditFn } = useMutation({
    mutationFn: createCredit,
  })

  const { refetch } = useQuery<Credit[], Error>({
    queryKey: ['credits', workspaceActive?.id],
    queryFn: () => getCredits(workspaceActive!.id),
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

  async function handleCreateCreditSubmit(data: CreateCreditProps) {
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Caixinha não está pronta. Tente novamente.")
      return
    }

    try {
      const response = await createCreditFn({
        workspaceId: workspaceActive.id,
        ...data,
      })

      if (response) {
        refetch()
        toast.success(response.message || "Receita criada com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar nova receita: ${errMessage}`)
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

  const responsibleItems = responsibles.map((r) => ({
    id: r.id,
    name: r.name,
    icon: <User className="h-4 w-4 text-muted-foreground" />,
  }))

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setModalIsOpen(true)} variant="default">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nova Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Receita</DialogTitle>
          <DialogDescription>
            Adicione uma nova receita para registrar suas entradas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCreditSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Receita</FormLabel>
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
                            format(new Date(field.value), "PPP")
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

            <div className="flex flex-col md:flex-row gap-2 w-full">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Salário, Freelance..." {...field} />
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
                        placeholder="Selecione a categoria..."
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

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Entrada</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 md:grid-cols-4 w-full"
                    >
                      <div className="w-full">
                        <RadioGroupItem value="Pix" id="credit-pix" className="peer sr-only" />
                        <Label
                          htmlFor="credit-pix"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400">
                            <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                            <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
                          </svg>
                          Pix
                        </Label>
                      </div>
                      <div className="w-full">
                        <RadioGroupItem value="Conta" id="credit-conta" className="peer sr-only" />
                        <Label
                          htmlFor="credit-conta"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Landmark className="mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Conta
                        </Label>
                      </div>
                      <div className="w-full">
                        <RadioGroupItem value="Débito" id="credit-debito" className="peer sr-only" />
                        <Label
                          htmlFor="credit-debito"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <Banknote className="mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Débito
                        </Label>
                      </div>
                      <div className="w-full">
                        <RadioGroupItem value="Crédito" id="credit-credito" className="peer sr-only" />
                        <Label
                          htmlFor="credit-credito"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <CreditCard className="mb-2 h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Crédito
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="justify-between pt-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Criar Receita
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
