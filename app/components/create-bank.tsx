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
import { Bank, CreateBank as CreateBankProps, createBankSchema } from "../types/financial"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createBank } from "../http/banks/create-bank"
import { useWorkspace } from "../hooks/use-workspace"
import { getBanks } from "../http/banks/get-banks"

export function CreateBank() {
  const { workspaceActive, isLoading: isWorkspaceLoading, error: workspaceError } = useWorkspace()

  const form = useForm<CreateBankProps>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: "",
      code: "",
      iconUrl: ""
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

  async function handleCreateBank({name, code, iconUrl}: CreateBankProps) {
    try {
      if (!!workspaceActive && !isWorkspaceLoading && !workspaceError) {
        const response = await createBankFn({
          name,
          code,
          iconUrl,
          workspaceId: workspaceActive.id
        })

        if (response) {
          refetch()
          toast.success(response.message)
        }
      }

    } catch(error: unknown) {
      toast.error(`
          Erro ao criar novo banco.
          Erro: ${error}
        `)
    }
  }


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
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
          <form onSubmit={form.handleSubmit(handleCreateBank)} className="space-y-6">
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
            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://exemple.com/image-bank" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="justify-between">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="submit">
                  Criar Banco
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>

      </DialogContent>
    </Dialog>
  )
}
