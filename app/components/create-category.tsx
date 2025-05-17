import { BanknoteArrowDown, BanknoteArrowUp, PlusCircle, UploadCloud } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { DynamicIcon,
  iconNames as allLucideIconNames,
} from 'lucide-react/dynamic'
import { toast } from 'sonner'
import { IconPicker } from './icon-picker'
import { ChevronsUpDown } from 'lucide-react'
import { Command, CommandInput } from './ui/command'
import { cn } from "../lib/utils"

type CreateCategoryFormData = CreateCategoryProps

export function CreateCategory() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      type: "expense"
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

  async function handleCreateCategoriesubmit(data: CreateCategoryProps) {
    console.log(data)
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Workspace não está pronto. Tente novamente.")
      return
    }

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("type", data.type)
    formData.append("icon", data.icon)

    try {
      const response = await createCategoryFn({
        payload: formData,
        workspaceId: workspaceActive.id
      })

      if (response) {
        refetch()
        toast.success(response.message || "Categoria criada com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar nova categoria: ${errMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleModalOpenChange = (open: boolean) => {
    setModalIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  const filteredIconNames = useMemo(() => {
    if (!searchTerm.trim()) {
      return allLucideIconNames
    }
    return allLucideIconNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
    )
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
            Adicione uma nova categoria para prosseguir com o uso da plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCategoriesubmit)} className="space-y-6">
          <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 w-full"
                      >
                        <div className="w-full">
                          <RadioGroupItem
                            value="expense"
                            id="expense"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="expense"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-red-500 peer-data-[state=checked]:border-red-500 [&:has([data-state=checked])]:border-red-500 peer-data-[state=checked]:text-red-500 [&:has([data-state=checked])]:text-red-500"
                          >
                            <BanknoteArrowDown className="mb-3 h-6 w-6" />
                            Despesa
                          </Label>
                        </div>                        
                        <div className="w-full">
                          <RadioGroupItem
                            value="income"
                            id="income"
                            className="peer sr-only"
                            aria-label="Workspace pessoal"
                          />
                          <Label
                            htmlFor="income"
                            className="flex flex-col w-full items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent  hover:text-green-500 peer-data-[state=checked]:border-green-500 [&:has([data-state=checked])]:border-green-500 peer-data-[state=checked]:text-green-500 [&:has([data-state=checked])]:text-green-500"
                          >
                            <BanknoteArrowUp className="mb-3 h-6 w-6" />
                            Receita
                          </Label>
                        </div>                        
                      </RadioGroup>
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Seus campos existentes */}
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
                        <Command shouldFilter={true}>
                          <CommandInput
                            placeholder="Procurar icone..."
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
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="Alimentação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="justify-between">
              {/* Ajuste no DialogClose e Button */}
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading || form.formState.isSubmitting}>
                {isUploading ? (
                  <>
                    <UploadCloud className="animate-pulse h-4 w-4 mr-2" />
                    Enviando Logo...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Criar Categoria
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}