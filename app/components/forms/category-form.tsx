"use client"

import React, { useMemo, useState } from "react"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronsUpDown, Loader2, Plus, Save, Tag, X } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Command, CommandInput } from "@/app/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { IconPicker } from "@/app/components/icon-picker"
import { searchCatalogIcons } from "@/app/lib/icons-catalog"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { createCategory } from "@/app/http/categories/create-category"
import { updateCategory } from "@/app/http/categories/update-category"
import {
  Category,
  CreateCategory as CreateCategoryProps,
  createCategorySchema,
} from "@/app/types/financial"
import { cn } from "@/app/lib/utils"

interface CategoryFormProps {
  mode: "create" | "edit"
  category?: Category
}

export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const isEdit = mode === "edit"

  const form = useForm<CreateCategoryProps>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name || "",
      icon: (category?.icon as IconName) || ("tag" as IconName),
      type: category?.type || "all",
    },
  })

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (data: CreateCategoryProps) =>
      createCategory({
        workspaceId: workspaceActive!.id,
        name: data.name,
        icon: data.icon,
        type: data.type || "all",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive?.id] })
      toast.success(res?.message || "Categoria criada com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/categories`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar categoria.")
    },
  })

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: CreateCategoryProps) =>
      updateCategory(workspaceActive!.id, category!.id, {
        name: data.name,
        icon: data.icon,
        type: data.type || "all",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["category", category?.id] })
      toast.success(res?.message || "Categoria atualizada com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/categories`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar categoria.")
    },
  })

  const isPending = isCreating || isUpdating

  const filteredIconNames = useMemo(() => {
    return searchCatalogIcons(searchTerm)
  }, [searchTerm])

  const onSubmit = async (data: CreateCategoryProps) => {
    if (!workspaceActive) return
    if (isEdit) {
      await updateMutation(data)
    } else {
      await createMutation(data)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/categories`)
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          {isEdit ? "Editar Categoria" : "Nova Categoria"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isEdit
            ? "Modifique o nome, ícone e aplicação desta categoria."
            : "Cadastre uma nova categoria para organizar e classificar seus lançamentos."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Linha 1: Ícone + Nome */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full">
            {/* Seletor de Ícone */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-semibold">Ícone *</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={popoverOpen}
                          className={cn(
                            "w-20 h-10 justify-between bg-background/80",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            <div className="flex items-center">
                              <DynamicIcon name={field.value as IconName} className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="h-4 w-4 border-dashed border rounded-full" />
                          )}
                          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] sm:w-[380px] p-2" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Buscar ícone (ex: comida, carro, casa, saude)..."
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <IconPicker
                          icons={filteredIconNames}
                          selectedIcon={field.value}
                          onIconSelect={(iconName) => {
                            form.setValue("icon", iconName as IconName, { shouldValidate: true })
                            setPopoverOpen(false)
                            setSearchTerm("")
                          }}
                        />
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome da Categoria */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-1 w-full">
                  <FormLabel className="text-xs font-semibold">Nome da Categoria *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Alimentação, Moradia, Transporte..."
                      className="h-10 bg-background/80"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Linha 2: Tipo de Aplicação */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">Aplicar Categoria Em</FormLabel>
                <Select value={field.value || "all"} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-background/80">
                      <SelectValue placeholder="Selecione a aplicação..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">🌐 Ambas (Despesas e Receitas)</SelectItem>
                    <SelectItem value="expense">📉 Apenas Despesas</SelectItem>
                    <SelectItem value="income">📈 Apenas Receitas</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[11px]">
                  Define em quais formulários esta categoria aparecerá para seleção.
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
              {isEdit ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
