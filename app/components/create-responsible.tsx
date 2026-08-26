"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Plus, UserPlus } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { CreatePersonResponsible, createPersonResponsibleSchema } from "@/app/types/financial"
import { createResponsible } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"

export function CreateResponsible() {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<CreatePersonResponsible>({
    resolver: zodResolver(createPersonResponsibleSchema),
    defaultValues: {
      name: "",
      email: "",
      pixKey: "",
      pixKeyType: "cpf",
    },
  })

  const { mutateAsync: createResponsibleMutation, isPending } = useMutation({
    mutationFn: (data: CreatePersonResponsible) =>
      createResponsible(workspaceActive!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      toast.success("Responsável cadastrado com sucesso!")
      setOpen(false)
      form.reset()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cadastrar responsável.")
    },
  })

  const onSubmit = async (data: CreatePersonResponsible) => {
    if (!workspaceActive) return
    await createResponsibleMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <UserPlus className="h-4 w-4" />
          Novo Responsável
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Responsável por Despesas</DialogTitle>
          <DialogDescription>
            Cadastre uma pessoa para dividir gastos, gerar cobranças PIX ou vincular a despesas conjuntas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Pessoa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lucas Silva, Mariana..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail (opcional para convite)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="lucas@exemplo.com"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="pixKeyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo PIX</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "cpf"}>
                      <FormControl>
                        <SelectTrigger>
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

              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="pixKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX (para cobrança)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Chave para receber..."
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
