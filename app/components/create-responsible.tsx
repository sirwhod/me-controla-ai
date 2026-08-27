"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Plus, UserPlus, Mail, User } from "lucide-react"

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
import { cn } from "@/app/lib/utils"
import { CreatePersonResponsible, createPersonResponsibleSchema } from "@/app/types/financial"
import { createResponsible } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"

interface CreateResponsibleProps {
  className?: string
  fullWidth?: boolean
}

export function CreateResponsible({ className, fullWidth }: CreateResponsibleProps = {}) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<CreatePersonResponsible>({
    resolver: zodResolver(createPersonResponsibleSchema),
    defaultValues: {
      name: "",
      email: "",
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
        <Button className={cn("gap-2 font-semibold", fullWidth && "w-full", className)}>
          <UserPlus className="h-4 w-4" />
          Novo Responsável
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Responsável
          </DialogTitle>
          <DialogDescription>
            Cadastre uma pessoa para associar a receitas e acompanhar valores a receber.
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
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Ex: Lucas Silva, Mariana..." {...field} />
                    </div>
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
                  <FormLabel>E-mail (opcional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        className="pl-9"
                        placeholder="exemplo@email.com"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </div>
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
