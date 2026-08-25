"use client"

import { Banknote, CalendarIcon, CreditCard, Landmark, PlusCircle } from "lucide-react"
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
import { Credit, CreateCredit as CreateCreditProps, createCreditSchema, Bank, Category } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createCredit } from "../http/credits/create-credit"
import { useWorkspace } from "../hooks/use-workspace"
import { getCredits } from "../http/credits/get-credits"
import { useEffect, useState } from "react" 
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { getBanks } from "../http/banks/get-banks"
import { getCategories } from "../http/categories/get-categories"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { DynamicIcon, IconName } from "lucide-react/dynamic"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { cn } from "../lib/utils"
import { format } from "date-fns"
import { Calendar } from "./ui/calendar"

type CreateCreditFormData = CreateCreditProps

export function CreateCredit() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)

  const form = useForm<CreateCreditFormData>({
    resolver: zodResolver(createCreditSchema),
    defaultValues: {
      description: "",
      date: new Date().toISOString(),
      bankId: "",
      categoryId: "",
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

  const { data: banks, isLoading: isBanksLoading } = useQuery<Bank[], Error>({
    queryKey: ['banks', workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const { data: categories, isLoading: isCategoriesLoading } = useQuery<Category[], Error>({
    queryKey: ['categories', workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  const incomeCategories = categories?.filter(c => c.type === 'income') || categories

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
            Adicione uma nova entrada financeira na caixinha.
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
                      <Input placeholder="Ex: Salário, Rendimentos" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma categoria." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategoriesLoading && (
                          <div className="p-2 text-xs text-muted-foreground text-center">Carregando categorias...</div>
                        )}
                        {!isCategoriesLoading && (!incomeCategories || incomeCategories.length === 0) && (
                          <div className="p-2 text-xs text-muted-foreground text-center">Nenhuma categoria encontrada.</div>
                        )}
                        {!isCategoriesLoading && incomeCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <DynamicIcon
                              name={category.icon as IconName}
                              size={16}
                            />
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione um banco." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isBanksLoading && (
                          <div className="p-2 text-xs text-muted-foreground text-center">Carregando bancos...</div>
                        )}
                        {!isBanksLoading && (!banks || banks.length === 0) && (
                          <div className="p-2 text-xs text-muted-foreground text-center">Nenhum banco encontrado.</div>
                        )}
                        {!isBanksLoading && banks?.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.iconUrl ? (
                              <Image
                                src={bank.iconUrl}
                                alt={bank.name}
                                width={16}
                                height={16}
                              />
                            ) : (
                              <Landmark className="h-4 w-4 text-foreground" />
                            )}
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="mb-2 h-5 w-5">
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
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Landmark className="mb-2 h-5 w-5" />
                          Conta
                        </Label>
                      </div>
                      <div className="w-full">
                        <RadioGroupItem value="Débito" id="credit-debito" className="peer sr-only" />
                        <Label
                          htmlFor="credit-debito"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <Banknote className="mb-2 h-5 w-5" />
                          Débito
                        </Label>
                      </div>
                      <div className="w-full">
                        <RadioGroupItem value="Crédito" id="credit-credito" className="peer sr-only" />
                        <Label
                          htmlFor="credit-credito"
                          className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <CreditCard className="mb-2 h-5 w-5" />
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
                <PlusCircle className="h-4 w-4 mr-2" />
                {form.formState.isSubmitting ? "Criando..." : "Criar Receita"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
