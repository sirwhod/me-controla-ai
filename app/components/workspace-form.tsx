"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/app/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Input } from "@/app/components/ui/input"
import { toast } from "sonner"
import { DialogClose, DialogFooter } from "./ui/dialog"
import { createWorkspaceAction } from "../actions/workspace-actions"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { Loader2, PlusCircle, User, Users } from "lucide-react"
import { useWorkspace } from "../hooks/use-workspace"

const FormSchema = z.object({
  name: z.string().min(2, {
    message: "O Nome da caixinha precisa ter pelo menos 2 caracteres",
  }),
  type: z.enum(["personal", "shared"])
})

export type CreateWorkspaceRequest = z.infer<typeof FormSchema>

interface WorkspaceFormProps {
  isDialog?: boolean
}

export function WorkspaceForm({isDialog = false}: WorkspaceFormProps) {
  const { refetch } = useWorkspace()
  const form = useForm<CreateWorkspaceRequest>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
    },
  })

  async function handleCreateWorkspace({name, type}: CreateWorkspaceRequest) {
      try {
        const result = await createWorkspaceAction({name, type});
  
        if (!result.success) {
           toast.error(result.message || 'Erro desconhecido ao criar caixinha');
        }
  
        console.log('Caixinha criado:', result.workspaceId);
  
      } catch (err) {
        console.error('Erro ao criar caixinha:', err);
      } finally {
        refetch()
        toast.success("Caixinha criado com sucesso!")
      }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleCreateWorkspace)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Caixinha</FormLabel>
              <FormControl>
                <Input placeholder="Caixinha da Família" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo da Caixinha</FormLabel>
              <FormControl>
                <ToggleGroup
                    type="single"
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap w-full"
                  >
                    <ToggleGroupItem value="personal" aria-label="Workspace pessoal">
                      <User />
                      Pessoal
                    </ToggleGroupItem>
                    <ToggleGroupItem value="shared" aria-label="Workspace compartilhado">
                      <Users />
                      Compartilhado
                    </ToggleGroupItem>
                  </ToggleGroup>
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isDialog ? (
          <DialogFooter>
          <DialogClose disabled={form.formState.isSubmitting} asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          {/* O botão agora chama a função handleCreateWorkspace */}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4 "/>}
            {form.formState.isSubmitting ? 'Criando...' : 'Criar caixinha'}
          </Button>
        </DialogFooter>
        ) : <Button type="submit">Criar caixinha</Button>}
      </form>
    </Form>
  )
}
