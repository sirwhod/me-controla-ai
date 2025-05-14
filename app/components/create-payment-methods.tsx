import { Banknote, CreditCard, Landmark, PlusCircle } from "lucide-react"

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
import { Input } from "@/app/components/ui/input"
import { useForm } from "react-hook-form"
import { PaymentMethod, CreatePaymentMethod as CreatePaymentMethodSchemaProps, createPaymentMethodSchema } from "../types/financial"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useWorkspace } from "../hooks/use-workspace"
import { useState } from "react"
import { createPaymentMethod } from "../http/payment-methods/create-payment-method"
import { getPaymentMethods } from "../http/payment-methods/get-payment-methods"
import { Separator } from "./ui/separator"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"

interface CreatePaymentMethodProps { 
  bankId: string
}

export function CreatePaymentMethod({ bankId }: CreatePaymentMethodProps) {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreatePaymentMethodSchemaProps>({
    resolver: zodResolver(createPaymentMethodSchema),
    defaultValues: {
      name: "",
      type: "Crédito"
    },
  })

  const { mutateAsync: createPaymentMethodFn } = useMutation({
    mutationFn: createPaymentMethod
  })

  const { refetch } = useQuery<PaymentMethod[], Error>({
    queryKey: ['payment-methods', workspaceActive?.id, bankId],
    queryFn: () => getPaymentMethods({
      bankId,
      workspaceId: workspaceActive!.id
    }),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleCreatePaymentMethod({name, type, invoiceClosingDay, invoiceDueDate}: CreatePaymentMethodSchemaProps) {
    try {
      if (!!workspaceActive && !isWorkspaceLoading && !workspaceError) {
        const response = await createPaymentMethodFn({
          name, 
          type, 
          bankId, 
          invoiceClosingDay, 
          invoiceDueDate,
          workspaceId: workspaceActive.id
        })

        if (response) {
          refetch()
          toast.success(response.message)
          setModalIsOpen(!modalIsOpen)
        }
      }

    } catch(error: unknown) {
      toast.error(`
          Erro ao criar novo método de pagamento.
          Erro: ${error}
        `)
    }
  }

  return (
    <Dialog open={modalIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setModalIsOpen(!modalIsOpen)} variant="default">
          <PlusCircle />
          Novo Método de Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Método de Pagamento</DialogTitle>
          <DialogDescription>
            Adicione um novo método de pagamento para prosseguir com o uso da plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreatePaymentMethod)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="flex w-full"
                      >
                        <div className="w-full">
                          <RadioGroupItem
                            value="Crédito"
                            id="Crédito"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="Crédito"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <CreditCard className="mb-3 h-6 w-6" />
                            Crédito
                          </Label>
                        </div>
                        <div className="w-full">
                          <RadioGroupItem
                            value="Débito"
                            id="Débito"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="Débito"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Banknote className="mb-3 h-6 w-6" />
                            Débito
                          </Label>
                        </div>
                        <div className="w-full">
                          <RadioGroupItem
                            value="Pix"
                            id="Pix"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="Pix"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <svg fill="currentColor" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className="mb-3 h-6 w-6">
                              <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"/>
                              <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"/>
                            </svg>
                            Pix
                          </Label>
                        </div>
                        <div className="w-full">
                          <RadioGroupItem
                            value="Conta"
                            id="Conta"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="Conta"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                            <Landmark className="mb-3 h-6 w-6" />
                            Conta
                          </Label>
                        </div>
                        
                      </RadioGroup>
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apelido</FormLabel>
                  <FormControl>
                    <Input placeholder="Crédito" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("type") === "Crédito" && (
              <>
                <Separator />
                <div>
                  <strong>Dados do crédito</strong>
                  <span>Informe os dias de Fechamento e Pagamento da fatura.</span>
                  <div className="flex flex-row gap-2 w-full">
                    <FormField
                      control={form.control}
                      name="invoiceClosingDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fechamento da fatura</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="invoiceDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pagamento da Fatura</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
            <DialogFooter className="justify-between">
              <DialogClose onClick={() => setModalIsOpen(!modalIsOpen)} asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                <PlusCircle className="h-4 w-4" />
                Criar Método de Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
