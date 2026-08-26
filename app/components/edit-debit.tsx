"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit2, Loader2, Save, Info } from "lucide-react"

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
import { Debit, updateDebitSchema, UpdateDebit as UpdateDebitProps, Category, Bank } from "@/app/types/financial"
import { updateDebit } from "@/app/http/debits/update-debit"
import { getCategories } from "@/app/http/categories/get-categories"
import { getBanks } from "@/app/http/banks/get-banks"
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

  const { mutateAsync: updateDebitMutation, isPending } = useMutation({
    mutationFn: (data: UpdateDebitProps) =>
      updateDebit(workspaceActive!.id, debit.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debits", workspaceActive?.id] })
      toast.success("Despesa atualizada com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar despesa.")
    },
  })

  const onSubmit = async (data: UpdateDebitProps) => {
    if (!workspaceActive) return
    await updateDebitMutation(data)
  }

  const handleQuickCreateCategory = async (name: string) => {
    if (!workspaceActive) return null
    const formData = new FormData()
    formData.append("name", name)
    formData.append("type", "all")
    formData.append("icon", "tag")
    const res = await createCategory({ workspaceId: workspaceActive.id, payload: formData })
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

  const isRecurringOrInstallment = debit.type && debit.type !== "Comum"

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

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Despesa</DialogTitle>
          <DialogDescription>
            Atualize as informações, valor e categoria desta despesa.
          </DialogDescription>
        </DialogHeader>

        {isRecurringOrInstallment && (
          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Esta despesa é do tipo <strong>{debit.type}</strong>. Alterações de valor e data serão aplicadas aos lançamentos futuros pendentes, preservando o histórico já pago.
            </span>
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
                    <Input placeholder="Ex: Mercado, Uber, Restaurante..." {...field} />
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "Pix"}>
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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "pending"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
            </div>

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
