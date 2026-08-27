"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit2, Loader2, Save } from "lucide-react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Bank, updateBankSchema, UpdateBank as UpdateBankProps } from "@/app/types/financial"
import { updateBank } from "@/app/http/banks/update-bank"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"

interface EditBankProps {
  bank: Bank
  asDropdownItem?: boolean
}

export function EditBank({ bank, asDropdownItem = false }: EditBankProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<UpdateBankProps>({
    resolver: zodResolver(updateBankSchema),
    defaultValues: {
      name: bank.name || "",
      code: bank.code || "",
      pixKey: bank.pixKey || "",
      pixKeyType: bank.pixKeyType || "cpf",
      invoiceClosingDay: bank.invoiceClosingDay || "",
      invoiceDueDate: bank.invoiceDueDate || "",
    },
  })

  const { mutateAsync: updateBankMutation, isPending } = useMutation({
    mutationFn: (data: UpdateBankProps) =>
      updateBank(workspaceActive!.id, bank.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] })
      toast.success("Banco/Cartão atualizado com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar banco.")
    },
  })

  const onSubmit = async (data: UpdateBankProps) => {
    if (!workspaceActive) return
    await updateBankMutation(data)
  }

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
            Editar banco
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
          <DialogTitle>Editar Banco / Conta</DialogTitle>
          <DialogDescription>
            Atualize as informações do banco, conta e faturas de cartão.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Banco / Conta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Itaú..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código / Número (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 260, 341..." value={field.value || ""} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chave PIX do Banco */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="pixKeyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Chave</FormLabel>
                    <Select
                      value={field.value || "cpf"}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pixKey"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Chave PIX da Conta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: seu@email.com ou 000.000.000-00"
                        className="h-9"
                        {...field}
                        value={field.value || ""}
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
                name="invoiceClosingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Fechamento Fatura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10" type="number" min={1} max={31} value={field.value || ""} onChange={field.onChange} />
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
                    <FormLabel>Dia Vencimento Fatura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 17" type="number" min={1} max={31} value={field.value || ""} onChange={field.onChange} />
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
