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
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createCategory } from "../http/categories/create-category"
import { useWorkspace } from "../hooks/use-workspace"
import { getCategories } from "../http/categories/get-categories"
import { useState } from "react"
import { ImageUploadField } from "./image-upload-field"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"
import { Label } from "./ui/label"

type CreateCategoryFormData = CreateCategoryProps

export function CreateCategory() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      iconUrl: "",
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

    setIsUploading(true)

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("type", data.type)

      // PONTO CRÍTICO AQUI:
    if (data.imageFile && data.imageFile.length > 0) {
      const fileToUpload = data.imageFile[0];
      console.log("Arquivo que será anexado:", fileToUpload); // Adicione este log
      console.log("Nome do arquivo:", fileToUpload.name);
      console.log("Tipo do arquivo:", fileToUpload.type);
      console.log("Tamanho do arquivo:", fileToUpload.size);
      formData.append("imageFile", fileToUpload, fileToUpload.name); // Tente adicionar o nome do arquivo como terceiro argumento
    } else {
      console.log("Nenhum imageFile para anexar.");
    }

    // Log para verificar o FormData antes de enviar para a função http
    console.log("Conteúdo do FormData antes de chamar a API (frontend):");
    for (const pair of formData.entries()) {
      console.log(pair[0] + ': ', pair[1]);
    }

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
            <div className="flex flex-row gap-6 items-end w-full">
              <FormField
                control={form.control}
                name="imageFile"
                render={({ field, fieldState }) => (
                  <FormItem>
                    {/* O RHFImageUploadField pode ter seu próprio label, ou você pode adicionar um FormLabel aqui se preferir */}
                    {/* <FormLabel>Logo do Categoria</FormLabel> */} 
                    <FormControl>
                      <ImageUploadField
                        name={field.name}
                        setValue={form.setValue}
                        formValue={field.value} // Passa o valor atual do FileList
                        error={fieldState.error}
                        // label="Logo da Categoria" // Passa o label para o componente customizado
                        className="h-36 w-36"
                      />
                    </FormControl>
                    <FormMessage /> {/* Exibirá erros do Zod para imageFile */}
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