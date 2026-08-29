"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit2, Loader2, Save, Info, CreditCard as CardIcon } from "lucide-react"

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Debit, updateDebitSchema, UpdateDebit as UpdateDebitProps, Category, Bank, CreditCard as CreditCardType, PersonResponsible } from "@/app/types/financial"
import { updateDebit } from "@/app/http/debits/update-debit"
import { getCategories } from "@/app/http/categories/get-categories"
import { getBanks } from "@/app/http/banks/get-banks"
import { getCards } from "@/app/http/cards"
import { getResponsibles, createResponsible } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { QuickCreateSelect } from "@/app/components/ui/quick-create-select"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"
import { createCategory } from "@/app/http/categories/create-category"
import { createBank } from "@/app/http/banks/create-bank"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"

interface EditDebitProps {
  debit: Debit
  asDropdownItem?: boolean
}

export function EditDebit({ debit, asDropdownItem = false }: EditDebitProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const debitDateString = debit.date ? new Date(debit.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)

  const form = useForm<UpdateDebitProps>({
    resolver: zodResolver(updateDebitSchema),
    defaultValues: {
      description: debit.description || "",
      value: debit.value || 0,
      date: debit.date ? new Date(debit.date).toISOString() : new Date().toISOString(),
      bankId: debit.bankId || null,
      creditCardId: debit.creditCardId || null,
      categoryId: debit.categoryId || null,
      responsibleId: debit.responsibleId || null,
      paymentMethod: debit.paymentMethod || "Pix",
      status: debit.status || "pending",
      updateFutureOnly: true,
    },
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories", workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    enabled: !!workspaceActive && open,
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    enabled: !!workspaceActive && open,
  })

  const { data: cards = [] } = useQuery<CreditCardType[]>({
    queryKey: ["cards", workspaceActive?.id],
    queryFn: () => getCards(workspaceActive!.id),
    enabled: !!workspaceActive && open,
  })

  const { data: responsibles = [] } = useQuery<PersonResponsible[]>({
    queryKey: ["responsibles", workspaceActive?.id],
    queryFn: () => getResponsibles(workspaceActive!.id),
    enabled: !!workspaceActive && open,
  })

  const { mutateAsync: updateDebitMutation, isPending } = useMutation({
    mutationFn: (data: UpdateDebitProps) =>
      updateDebit(workspaceActive!.id, debit.id!, data),
    onSuccess: (_response, variables) => {
      queryClient.setQueriesData<Debit[]>(
        { queryKey: ["debits", workspaceActive?.id] },
        (cached) => cached?.map((item) => item.id === debit.id ? ({ ...item, ...variables } as unknown as Debit) : item)
      )
      queryClient.invalidateQueries({ queryKey: ["analytics-summary", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["annual-summary", workspaceActive?.id] })
      toast.success("Despesa atualizada com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar despesa.")
    },
  })

  const onSubmit = async (data: UpdateDebitProps) => {
    if (!workspaceActive) return
    const payload = { ...data }
    if (payload.paymentMethod === "Crédito" && payload.creditCardId) {
      const card = cards.find(c => c.id === payload.creditCardId)
      if (card?.bankId) {
        payload.bankId = card.bankId
      }
    }
    await updateDebitMutation(payload)
  }

  const handleQuickCreateCategory = async (name: string) => {
    if (!workspaceActive) return null
    const res = await createCategory({ workspaceId: workspaceActive.id, name, type: 'all', icon: 'tag' as IconName })
    await queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive.id] })
    toast.success(`Categoria "${name}" criada!`)
    return res.categoryId
  }

  const handleQuickCreateBank = async (name: string) => {
    if (!workspaceActive) return null
    const formData = new FormData()
    formData.append("name", name)
    const res = await createBank({ workspaceId: workspaceActive.id, payload: formData })
    await queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive.id] })
    toast.success(`Banco "${name}" criado!`)
    return res.bankId
  }

  const handleQuickCreateResponsible = async (name: string) => {
    if (!workspaceActive) return null
    const res = await createResponsible(workspaceActive.id, { name })
    await queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive.id] })
    toast.success(`Responsável "${name}" cadastrado!`)
    return res.responsibleId
  }

  const isRecurring = debit.type === "Fixo" || debit.type === "Assinatura" || debit.type === "Parcelamento"
  const isCreditPayment = form.watch("paymentMethod") === "Crédito"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asDropdownItem ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault()
              setOpen(true)
            }}
            className="cursor-pointer gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar despesa
          </DropdownMenuItem>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit2 className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Atualize os dados desta despesa ({debit.type}).
          </DialogDescription>
        </DialogHeader>

        {isRecurring && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Lançamento Recorrente:</strong>
              <p className="mt-0.5 text-muted-foreground">
                As alterações realizadas aqui atualizarão esta despesa e as parcelas/ocorrências futuras a partir desta data, preservando o histórico passado.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Supermercado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        defaultValue={debitDateString}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val) field.onChange(new Date(val + "T12:00:00Z").toISOString())
                        }}
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
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      if (val === "Crédito") {
                        const currentCard = cards.find(c => c.id === form.getValues("creditCardId"))
                        if (currentCard?.bankId) {
                          form.setValue("bankId", currentCard.bankId)
                        }
                      } else {
                        form.setValue("creditCardId", null)
                      }
                    }}
                    defaultValue={field.value || "Pix"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Crédito">Crédito</SelectItem>
                      <SelectItem value="Débito">Débito</SelectItem>
                      <SelectItem value="Conta">Dinheiro / Conta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <QuickCreateSelect
                        items={categories.map((c) => ({
                          id: c.id,
                          name: c.name,
                          icon: c.icon ? <DynamicIcon name={c.icon as IconName} className="h-4 w-4 text-primary" /> : undefined,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Selecione categoria"
                        searchPlaceholder="Buscar ou criar categoria..."
                        createLabel="Criar categoria"
                        onCreateNew={handleQuickCreateCategory}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCreditPayment ? (
                <FormField
                  control={form.control}
                  name="creditCardId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cartão de Crédito</FormLabel>
                      <FormControl>
                        <QuickCreateSelect
                          items={cards.map((c) => ({
                            id: c.id,
                            name: `${c.name} ${c.bankName ? `(${c.bankName})` : ''}`,
                            icon: <CardIcon className="h-4 w-4 text-primary" />,
                          }))}
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
                    <FormItem>
                      <FormLabel>Banco / Conta</FormLabel>
                      <FormControl>
                        <QuickCreateSelect
                          items={banks.map((b) => ({
                            id: b.id,
                            name: b.name,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Selecione banco"
                          searchPlaceholder="Buscar ou criar banco..."
                          createLabel="Criar banco"
                          onCreateNew={handleQuickCreateBank}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="responsibleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável (opcional)</FormLabel>
                  <FormControl>
                    <QuickCreateSelect
                      items={responsibles.map((r) => ({
                        id: r.id,
                        name: r.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione responsável..."
                      searchPlaceholder="Buscar ou criar responsável..."
                      createLabel="Criar responsável"
                      onCreateNew={handleQuickCreateResponsible}
                    />
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
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
