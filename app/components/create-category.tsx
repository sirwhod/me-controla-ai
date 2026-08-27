import { PlusCircle } from "lucide-react"
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
import { Input } from "@/app/components/ui/input"
import { useForm } from "react-hook-form"
import { Category, CreateCategory as CreateCategoryProps, createCategorySchema } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createCategory } from "../http/categories/create-category"
import { useWorkspace } from "../hooks/use-workspace"
import { getCategories } from "../http/categories/get-categories"
import { useMemo, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import { toast } from 'sonner'
import { IconPicker } from './icon-picker'
import { ChevronsUpDown } from 'lucide-react'
import { Command, CommandInput } from './ui/command'
import { cn } from "../lib/utils"
import { searchCatalogIcons } from "../lib/icons-catalog"

type CreateCategoryFormData = CreateCategoryProps

export function CreateCategory() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: "all",
      icon: "tag" as IconName,
    },
  })

  const { mutateAsync: createCategoryFn } = useMutation({
    mutationFn: createCategory
  })

  const { refetch } = useQuery<Category[], Error>({
    queryKey: ['categories', workspaceActive?.id],
    queryFn: () => getCategories(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleCreateCategorySubmit(data: CreateCategoryProps) {
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Caixinha ativa não encontrada.")
      return
    }

    try {
      const response = await createCategoryFn({
        workspaceId: workspaceActive.id,
        name: data.name,
        icon: data.icon,
        type: data.type || "all",
      })

      if (response) {
        refetch()
        toast.success(response.message || "Categoria criada com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar categoria: ${errMessage}`)
    }
  }

  const handleModalOpenChange = (open: boolean) => {
    setModalIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  const filteredIconNames = useMemo(() => {
    return searchCatalogIcons(searchTerm)
  }, [searchTerm])

  return (
    <Dialog open={modalIsOpen} onOpenChange={handleModalOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => setModalIsOpen(true)} variant="default">
          <PlusCircle className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Crie uma categoria universal para organizar suas receitas e despesas.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCategorySubmit)} className="space-y-6">
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
                              'w-16 justify-between',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              <div className="flex items-center">
                                <DynamicIcon name={field.value} className="h-4 w-4" />
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
                            placeholder="Buscar ícone (ex: comida, carro, mercado, saude)..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                          />
                          <IconPicker
                            icons={filteredIconNames}
                            selectedIcon={field.value}
                            onIconSelect={(iconName) => {
                              form.setValue('icon', iconName, { shouldValidate: true })
                              setPopoverOpen(false)
                              setSearchTerm('')
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
                      <Input className="w-full" placeholder="Ex: Alimentação, Lazer, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="justify-between">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {form.formState.isSubmitting ? "Criando..." : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}