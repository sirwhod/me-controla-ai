"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Mail, Plus, Save, User, Users, X } from "lucide-react"

import { Button } from "@/app/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { createResponsible, updateResponsible } from "@/app/http/responsibles"
import {
  PersonResponsible,
  CreatePersonResponsible,
  createPersonResponsibleSchema,
} from "@/app/types/financial"

interface ResponsibleFormProps {
  mode: "create" | "edit"
  responsible?: PersonResponsible
}

export function ResponsibleForm({ mode, responsible }: ResponsibleFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const isEdit = mode === "edit"

  const form = useForm<CreatePersonResponsible>({
    resolver: zodResolver(createPersonResponsibleSchema),
    defaultValues: {
      name: responsible?.name || "",
      email: responsible?.email || "",
    },
  })

  const watchedName = form.watch("name") || ""
  const initials = watchedName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??"

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: CreatePersonResponsible) =>
      createResponsible(workspaceActive!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      toast.success("Responsável cadastrado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/responsibles`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cadastrar responsável.")
    },
  })

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: CreatePersonResponsible) =>
      updateResponsible(workspaceActive!.id, responsible!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      queryClient.invalidateQueries({
        queryKey: ["responsible-details", workspaceActive?.id, responsible?.id],
      })
      toast.success("Responsável atualizado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/responsibles`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar responsável.")
    },
  })

  const isPending = isCreating || isUpdating

  const onSubmit = async (data: CreatePersonResponsible) => {
    if (!workspaceActive) return
    if (isEdit) {
      await updateMutation(data)
    } else {
      await createMutation(data)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/responsibles`)
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          {isEdit ? "Editar Responsável" : "Novo Responsável"}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isEdit
            ? "Atualize o nome e e-mail vinculado a esta pessoa."
            : "Cadastre pessoas para vincular a despesas compartilhadas e acompanhar acertos de saldo."}
        </p>
      </div>

      <div className="flex items-center gap-3 p-3.5 mb-6 rounded-xl bg-muted/40 border border-border/60">
        <Avatar className="h-12 w-12 border border-border">
          {responsible?.userImage && (
            <AvatarImage src={responsible.userImage} alt={watchedName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {watchedName || "Nome da pessoa"}
          </span>
          <span className="text-xs text-muted-foreground">
            {form.watch("email") || "Sem e-mail informado"}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Nome da Pessoa *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-10 bg-background/80"
                      placeholder="Ex: Lucas Silva, Mariana Souza..."
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* E-mail */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">E-mail (Opcional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-9 h-10 bg-background/80"
                      placeholder="exemplo@email.com"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-[11px]">
                  Se a pessoa possuir conta no MeControla.AI com este e-mail, ela será vinculada automaticamente com foto de perfil.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="h-10 text-xs gap-1.5"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="h-10 text-xs font-semibold gap-1.5"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEdit ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isEdit ? "Salvar Alterações" : "Cadastrar Responsável"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
