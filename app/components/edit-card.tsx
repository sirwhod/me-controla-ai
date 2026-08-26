"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { CreditCard as CardIcon, Edit2, Loader2, Save } from "lucide-react"

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
import { CreditCard, UpdateCreditCard, updateCreditCardSchema, Bank } from "@/app/types/financial"
import { updateCard } from "@/app/http/cards"
import { getBanks } from "@/app/http/banks/get-banks"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { QuickCreateSelect } from "@/app/components/ui/quick-create-select"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { createBank } from "@/app/http/banks/create-bank"

interface EditCardProps {
  card: CreditCard
  asDropdownItem?: boolean
}

export function EditCard({ card, asDropdownItem = false }: EditCardProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<UpdateCreditCard>({
    resolver: zodResolver(updateCreditCardSchema),
    defaultValues: {
      name: card.name || "",
      bankId: card.bankId || "",
      last4Digits: card.last4Digits || "",
      limit: card.limit || undefined,
      closingDay: card.closingDay || 10,
      dueDay: card.dueDay || 17,
      color: card.color || "#6366f1",
    },
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    enabled: !!workspaceActive,
  })

  const { mutateAsync: updateCardMutation, isPending } = useMutation({
    mutationFn: (data: UpdateCreditCard) => updateCard(workspaceActive!.id, card.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards", workspaceActive?.id] })
      toast.success("Cartão de crédito atualizado com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar cartão.")
    },
  })

  const handleQuickCreateBank = async (bankName: string) => {
    if (!workspaceActive) return null
    try {
      const formData = new FormData()
      formData.append("name", bankName)
      const res = await createBank({ workspaceId: workspaceActive.id, payload: formData })
      await queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive.id] })
      toast.success(`Banco "${bankName}" criado com sucesso!`)
      return res.bankId
    } catch {
      toast.error("Erro ao criar banco.")
      return null
    }
  }

  const onSubmit = async (data: UpdateCreditCard) => {
    if (!workspaceActive) return
    await updateCardMutation(data)
  }

  const bankItems = banks.map((b) => ({
    id: b.id,
    name: b.name,
  }))

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
            Editar cartão
          </DropdownMenuItem>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Edit2 className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CardIcon className="h-5 w-5 text-primary" />
            Editar Cartão de Crédito
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do cartão, banco emissor, limite e dias de fechamento/vencimento.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank Ultravioleta..." {...field} />
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
                  <FormLabel>Banco Emissor / Conta Vinculada</FormLabel>
                  <FormControl>
                    <QuickCreateSelect
                      items={bankItems}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione o banco..."
                      searchPlaceholder="Buscar ou criar banco..."
                      createLabel="Criar banco"
                      onCreateNew={handleQuickCreateBank}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 5000"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last4Digits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Últimos 4 dígitos</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 1234" maxLength={4} value={field.value || ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="10"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="17"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(Number(e.target.value) || 1)}
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
