"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Landmark, Loader2, Plus, Save, X, Key, Calendar } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { ImageUploadField } from "@/app/components/image-upload-field"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { createBank } from "@/app/http/banks/create-bank"
import { updateBank } from "@/app/http/banks/update-bank"
import {
  Bank,
  CreateBank as CreateBankProps,
  createBankSchema,
  UpdateBank as UpdateBankProps,
} from "@/app/types/financial"

interface BankFormProps {
  mode: "create" | "edit"
  bank?: Bank
}

export function BankForm({ mode, bank }: BankFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const isEdit = mode === "edit"

  const form = useForm<CreateBankProps>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: bank?.name || "",
      code: bank?.code || "",
      pixKey: bank?.pixKey || "",
      pixKeyType: (bank?.pixKeyType as "cpf" | "cnpj" | "email" | "phone" | "random") || "cpf",
      invoiceClosingDay: bank?.invoiceClosingDay || "",
      invoiceDueDate: bank?.invoiceDueDate || "",
    },
  })

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (payload: FormData) =>
      createBank({
        workspaceId: workspaceActive!.id,
        payload,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] })
      toast.success(res?.message || "Banco cadastrado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao cadastrar banco.")
    },
  })

  const { mutateAsync: updateMutation, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateBankProps) =>
      updateBank(workspaceActive!.id, bank!.id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["bank", workspaceActive?.id, bank?.id] })
      toast.success(res?.message || "Banco atualizado com sucesso!")
      router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao atualizar banco.")
    },
  })

  const isPending = isCreating || isUpdating

  const onSubmit = async (data: CreateBankProps) => {
    if (!workspaceActive) return
    if (isEdit) {
      await updateMutation(data)
    } else {
      const formData = new FormData()
      formData.append("name", data.name)
      if (data.code) formData.append("code", data.code)
      if (data.pixKey) formData.append("pixKey", data.pixKey)
      if (data.pixKeyType) formData.append("pixKeyType", data.pixKeyType)
      if (data.imageFile && data.imageFile.length > 0) {
        formData.append("imageFile", data.imageFile[0])
      }
      if (data.invoiceClosingDay) formData.append("invoiceClosingDay", data.invoiceClosingDay)
      if (data.invoiceDueDate) formData.append("invoiceDueDate", data.invoiceDueDate)

      await createMutation(formData)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`)
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-7 shadow-xs">
      <div className="mb-6 pb-4 border-b border-border/60">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          {isEdit ? "Editar Instituição Bancária" : "Nova Instituição Bancária"}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {isEdit
            ? "Atualize as configurações, chave PIX e logo desta conta bancária."
            : "Cadastre um banco ou conta para vincular suas despesas, receitas e transferências."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção 1: Identificação */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Dados da Instituição
            </h3>

            {/* Logo do Banco (Apenas no Create / upload) */}
            {!isEdit && (
              <ImageUploadField
                name="imageFile"
                setValue={form.setValue}
                clearErrors={(name) => form.clearErrors(name as keyof CreateBankProps)}
                formValue={form.watch("imageFile")}
                error={form.formState.errors.imageFile}
                label="Logo da Instituição"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-semibold">Nome da Instituição *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Nubank, Itaú, Banco do Brasil..."
                        className="h-10 bg-background/80"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Código de Compensação */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Código do Banco (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 260, 341..."
                        className="h-10 bg-background/80"
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 2: Chave PIX */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Chave PIX (Para Pagamentos Rápidos)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Tipo de Chave */}
              <FormField
                control={form.control}
                name="pixKeyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Tipo de Chave</FormLabel>
                    <Select value={field.value || "cpf"} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-10 bg-background/80">
                          <SelectValue placeholder="Tipo de Chave" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                        <SelectItem value="random">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Chave PIX */}
              <FormField
                control={form.control}
                name="pixKey"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs font-semibold">Chave PIX</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Informe a chave PIX..."
                          className="pl-9 h-10 bg-background/80"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção 3: Ciclo de Fatura Opcional */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Ciclo de Fatura da Conta (Opcional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceClosingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Dia de Fechamento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ex: 10"
                          className="pl-9 h-10 bg-background/80"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </div>
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
                    <FormLabel className="text-xs font-semibold">Dia de Vencimento</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ex: 17"
                          className="pl-9 h-10 bg-background/80"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

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
              {isEdit ? "Salvar Alterações" : "Cadastrar Banco"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
