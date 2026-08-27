"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Edit2, Loader2, Save, Mail, User } from "lucide-react"

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
import { PersonResponsible, UpdatePersonResponsible, updatePersonResponsibleSchema } from "@/app/types/financial"
import { updateResponsible } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"

interface EditResponsibleProps {
  responsible: PersonResponsible
  asDropdownItem?: boolean
}

export function EditResponsible({ responsible, asDropdownItem = false }: EditResponsibleProps) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<UpdatePersonResponsible>({
    resolver: zodResolver(updatePersonResponsibleSchema),
    defaultValues: {
      name: responsible.name || "",
      email: responsible.email || "",
    },
  })

  const { mutateAsync: updateResponsibleMutation, isPending } = useMutation({
    mutationFn: (data: UpdatePersonResponsible) =>
      updateResponsible(workspaceActive!.id, responsible.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["responsible-details", workspaceActive?.id, responsible.id] })
      toast.success("Responsável atualizado com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar responsável.")
    },
  })

  const onSubmit = async (data: UpdatePersonResponsible) => {
    if (!workspaceActive) return
    await updateResponsibleMutation(data)
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
            Editar responsável
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
          <DialogTitle>Editar Responsável</DialogTitle>
          <DialogDescription>
            Atualize o nome ou o e-mail desta pessoa.
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
                      <Input className="pl-9" placeholder="Ex: Lucas Silva..." {...field} />
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
