import { PlusCircle, UploadCloud } from "lucide-react"
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
import { Bank, CreateBank as CreateBankProps, createBankSchema } from "../types/financial" 
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createBank } from "../http/banks/create-bank"
import { useWorkspace } from "../hooks/use-workspace"
import { getBanks } from "../http/banks/get-banks"
import { useState } from "react" 
import { Separator } from "./ui/separator"
import { ImageUploadField } from "./image-upload-field"

type CreateBankFormData = CreateBankProps

export function CreateBank() {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
  const [isUploading, setIsUploading] = useState<boolean>(false)

  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreateBankFormData>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: "",
      code: "",
      iconUrl: "",
    },
  })

  const { mutateAsync: createBankFn } = useMutation({
    mutationFn: createBank
  })

  const { refetch } = useQuery<Bank[], Error>({
    queryKey: ['banks', workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    staleTime: 1000 * 60 * 5,
    enabled: !!workspaceActive && !isWorkspaceLoading && !workspaceError,
  })

  async function handleCreateBankSubmit(data: CreateBankProps) {
    console.log(data)
    if (!workspaceActive || isWorkspaceLoading || workspaceError) {
      toast.error("Workspace não está pronto. Tente novamente.")
      return
    }

    setIsUploading(true)

    const formData = new FormData()
    formData.append("name", data.name)
    formData.append("code", data.code ?? "")
    
    if (data.invoiceClosingDay !== undefined && data.invoiceClosingDay !== null) {
      formData.append("invoiceClosingDay", String(data.invoiceClosingDay))
    }
    if (data.invoiceDueDate !== undefined && data.invoiceDueDate !== null) {
      formData.append("invoiceDueDate", String(data.invoiceDueDate))
    }

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
      const response = await createBankFn({
        payload: formData,
        workspaceId: workspaceActive.id
      })

      if (response) {
        refetch()
        toast.success(response.message || "Banco criado com sucesso!")
        setModalIsOpen(false)
        form.reset()
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
      toast.error(`Erro ao criar novo banco: ${errMessage}`)
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
          <PlusCircle />
          Novo Banco
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Banco</DialogTitle>
          <DialogDescription>
            Adicione um novo banco para prosseguir com o uso da plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateBankSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="imageFile"
              render={({ field, fieldState }) => (
                <FormItem>
                  {/* O RHFImageUploadField pode ter seu próprio label, ou você pode adicionar um FormLabel aqui se preferir */}
                  {/* <FormLabel>Logo do Banco</FormLabel> */} 
                  <FormControl>
                    <ImageUploadField
                      name={field.name}
                      setValue={form.setValue}
                      formValue={field.value} // Passa o valor atual do FileList
                      error={fieldState.error}
                      label="Logo do Banco" // Passa o label para o componente customizado
                    />
                  </FormControl>
                  <FormMessage /> {/* Exibirá erros do Zod para imageFile */}
                </FormItem>
              )}
            />

            {/* Seus campos existentes */}
            <div className="flex flex-row gap-2 w-full">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Banco</FormLabel>
                    <FormControl>
                      <Input className="w-full" placeholder="Itaú" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            {/* Seus campos de dados do crédito ... */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <strong className="text-lg font-semibold">Dados do crédito</strong>
                <p className="text-sm text-muted-foreground">Informe os dias de Fechamento e Pagamento da fatura.</p>
              </div>
              <div className="flex flex-row gap-2 w-full">
                <FormField
                  control={form.control}
                  name="invoiceClosingDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fechamento da fatura</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            placeholder="20" 
                            {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pagamento da Fatura</FormLabel>
                      <FormControl>
                        <Input 
                            type="number" 
                            placeholder="12" 
                            {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Criar Banco
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