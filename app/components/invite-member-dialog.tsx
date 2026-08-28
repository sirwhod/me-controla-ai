"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Mail, UserPlus } from "lucide-react"

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
import { useWorkspace } from "@/app/hooks/use-workspace"
import { inviteWorkspaceMember } from "@/app/http/members"

import { cn } from "@/app/lib/utils"

const inviteSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido"),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteMemberDialogProps {
  className?: string
  fullWidth?: boolean
  label?: string
}

export function InviteMemberDialog({
  className,
  fullWidth,
  label = "Convidar Membro",
}: InviteMemberDialogProps = {}) {
  const [open, setOpen] = useState(false)
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  })

  const { mutateAsync: inviteMutation, isPending } = useMutation({
    mutationFn: (data: InviteFormData) =>
      inviteWorkspaceMember(workspaceActive!.id, data.email),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceActive?.id] })
      toast.success(res.message || "Convite enviado com sucesso!")
      setOpen(false)
      form.reset()
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao enviar convite.")
    },
  })

  const onSubmit = async (data: InviteFormData) => {
    if (!workspaceActive) return
    await inviteMutation(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("gap-2 font-semibold", fullWidth && "w-full", className)}>
          <UserPlus className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Convidar Membro para a Caixinha
          </DialogTitle>
          <DialogDescription>
            Insira o e-mail do usuário para convidá-lo a visualizar e gerenciar esta caixinha com você.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail do Usuário</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="exemplo@email.com"
                        type="email"
                        className="pl-9"
                        {...field}
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
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar Convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
