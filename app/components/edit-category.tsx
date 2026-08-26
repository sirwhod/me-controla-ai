"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronsUpDown, Edit2, Loader2, Save } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Command, CommandInput } from "@/app/components/ui/command"
import { Category, updateCategorySchema, UpdateCategory as UpdateCategoryProps } from "@/app/types/financial"
import { updateCategory } from "@/app/http/categories/update-category"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { IconPicker } from "./icon-picker"
import { searchCatalogIcons } from "@/app/lib/icons-catalog"
import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu"
import { cn } from "@/app/lib/utils"

interface EditCategoryProps {
  category: Category
  asDropdownItem?: boolean
}

export function EditCategory({ category, asDropdownItem = false }: EditCategoryProps) {
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<UpdateCategoryProps>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: category.name || "",
      icon: (category.icon as IconName) || "tag",
      type: category.type || "all",
    },
  })

  const { mutateAsync: updateCategoryMutation, isPending } = useMutation({
    mutationFn: (data: UpdateCategoryProps) =>
      updateCategory(workspaceActive!.id, category.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", workspaceActive?.id] })
      toast.success("Categoria atualizada com sucesso!")
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar categoria.")
    },
  })

  const filteredIconNames = useMemo(() => {
    return searchCatalogIcons(searchTerm)
  }, [searchTerm])

  const onSubmit = async (data: UpdateCategoryProps) => {
    if (!workspaceActive) return
    await updateCategoryMutation(data)
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
            Editar categoria
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
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>
            Atualize o nome e o ícone da categoria.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-row gap-2 items-end w-full">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ícone</FormLabel>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={popoverOpen}
                            className={cn(
                              "w-16 justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              <div className="flex items-center">
                                <DynamicIcon name={field.value as IconName} className="h-4 w-4" />
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <div className="h-4 w-4 border-dashed border rounded-full" />
                              </div>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-2" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar ícone (ex: comida, carro, viagem, saude)..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                          />
                          <IconPicker
                            icons={filteredIconNames}
                            selectedIcon={field.value as IconName}
                            onIconSelect={(iconName) => {
                              form.setValue("icon", iconName, { shouldValidate: true })
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

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full flex flex-col gap-2">
                    <FormLabel>Nome da Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Alimentação" {...field} />
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
