"use client"

import React from "react"
import Image from "next/image"
import { useContextualRouter as useRouter } from "@/app/hooks/use-contextual-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Landmark, Loader2, Plus, Save, X, Key } from "lucide-react"

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
import { useWorkspace } from "@/app/hooks/use-workspace"
import { createBank } from "@/app/http/banks/create-bank"
import { updateBank } from "@/app/http/banks/update-bank"
import {
  Bank,
  CreateBank as CreateBankProps,
  createBankSchema,
  UpdateBank as UpdateBankProps,
} from "@/app/types/financial"
import { brazilianBankCatalog } from "@/app/lib/bank-catalog"
import { PageHeader } from "@/app/components/page-header"

interface BankFormProps {
  mode: "create" | "edit"
  bank?: Bank
}

export function BankForm({ mode, bank }: BankFormProps) {
  const router = useRouter()
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  const isEdit = mode === "edit"
  const [bankSearch, setBankSearch] = React.useState("")
  const [bankStep, setBankStep] = React.useState(1)

  const form = useForm<CreateBankProps>({
    resolver: zodResolver(createBankSchema),
    defaultValues: {
      name: bank?.name || "",
      code: bank?.code || "",
      pixKey: bank?.pixKey || "",
      pixKeyType: (bank?.pixKeyType as "cpf" | "cnpj" | "email" | "phone" | "random") || "cpf",
      invoiceClosingDay: bank?.invoiceClosingDay || "",
      invoiceDueDate: bank?.invoiceDueDate || "",
      catalogId: bank?.catalogId || null,
    },
  })

  const { mutateAsync: createMutation, isPending: isCreating } = useMutation({
    mutationFn: (payload: FormData) =>
      createBank({
        workspaceId: workspaceActive!.id,
        payload,
      }),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] })
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
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["banks", workspaceActive?.id] }),
        queryClient.invalidateQueries({ queryKey: ["bank", workspaceActive?.id, bank?.id] }),
      ])
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
      if (data.catalogId) formData.append("catalogId", data.catalogId)
      if (data.pixKey) formData.append("pixKey", data.pixKey)
      if (data.pixKeyType) formData.append("pixKeyType", data.pixKeyType)
      if (data.invoiceClosingDay) formData.append("invoiceClosingDay", data.invoiceClosingDay)
      if (data.invoiceDueDate) formData.append("invoiceDueDate", data.invoiceDueDate)

      await createMutation(formData)
    }
  }

  const handleCancel = () => {
    router.push(`${workspaceActive?.id ? `/${workspaceActive.id}` : ""}/manage/banks`)
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        className="border-b-0 pb-0"
        title={isEdit ? "Editar Instituição Bancária" : "Nova Instituição Bancária"}
        description={isEdit
          ? "Atualize as configurações, chave PIX e logo desta conta bancária."
          : "Cadastre um banco ou conta para vincular suas despesas, receitas e transferências."}
        icon={<Landmark className="size-5 shrink-0 text-primary md:size-6" aria-hidden="true" />}
      />

      <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
        {["Instituição", "Chave Pix", "Revisão"].map((label, index) => {
          const number = index + 1
          return <div key={label} className={`flex items-center gap-2 border-b-2 pb-2 text-xs font-semibold ${bankStep >= number ? "border-primary text-foreground" : "border-border text-muted-foreground"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full border ${bankStep >= number ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{number}</span><span className="hidden sm:inline">{label}</span></div>
        })}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/40 p-4 shadow-xs sm:p-7">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seção 1: Identificação */}
          {bankStep === 1 && <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Dados da Instituição
            </h3>

            {!isEdit && <FormField control={form.control} name="catalogId" render={({ field }) => (
              <FormItem><FormLabel className="text-xs font-semibold">Banco brasileiro (opcional)</FormLabel>
                <Input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} placeholder="Buscar por nome ou código..." className="mb-2 h-10 w-full bg-background/80" />
                <FormControl>
                  <div className="max-h-60 w-full overflow-y-auto rounded-xl border border-border/60 bg-background/70 p-1">
                    <button type="button" onClick={() => field.onChange(null)} className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${!field.value ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>Cadastro manual / banco não encontrado</button>
                    {brazilianBankCatalog.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(bankSearch.toLowerCase())).map((item) => (
                      <button type="button" key={item.id} onClick={() => { field.onChange(item.id); form.setValue("name", item.name, { shouldValidate: true }); form.setValue("code", item.code, { shouldValidate: true }) }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted ${field.value === item.id ? "bg-primary/10 text-primary" : "text-foreground"}`}>
                        <Image src={item.iconPath} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md object-contain" /><span><strong>{item.name}</strong><small className="ml-2 text-muted-foreground">{item.code}</small></span>
                      </button>
                    ))}
                    {!brazilianBankCatalog.some((item) => `${item.code} ${item.name}`.toLowerCase().includes(bankSearch.toLowerCase())) && <p className="px-3 py-3 text-xs text-muted-foreground">Nenhum banco encontrado. Use o cadastro manual.</p>}
                  </div>
                </FormControl><FormMessage />
                {field.value && field.value !== "manual" && (() => {
                  const selected = brazilianBankCatalog.find((item) => item.id === field.value)
                  return selected ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                      <Image src={selected.iconPath} alt={`Logo ${selected.name}`} width={48} height={48} className="h-12 w-12 rounded-lg object-contain" />
                      <div><p className="text-sm font-semibold">{selected.name}</p><p className="text-xs text-muted-foreground">Código COMPE {selected.code} · logo do catálogo</p></div>
                    </div>
                  ) : null
                })()}
              </FormItem>
            )} />}

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
          </div>}

          {/* Seção 2: Chave PIX */}
          {bankStep === 2 && <div className="space-y-4 pt-4 border-t border-border/40">
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
          </div>}

          {bankStep === 3 && <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revise os dados antes de salvar</h3>
            <div className="grid gap-3 text-sm sm:grid-cols-2"><div><span className="text-muted-foreground">Instituição</span><p className="font-semibold">{form.watch("name") || "Não informado"}</p></div><div><span className="text-muted-foreground">Código</span><p className="font-semibold">{form.watch("code") || "Não informado"}</p></div><div><span className="text-muted-foreground">Tipo de chave</span><p className="font-semibold uppercase">{form.watch("pixKeyType") || "Não informado"}</p></div><div><span className="text-muted-foreground">Chave Pix</span><p className="break-all font-semibold">{form.watch("pixKey") || "Não informado"}</p></div></div>
          </div>}

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

            {bankStep > 1 && <Button type="button" variant="outline" onClick={() => setBankStep((step) => step - 1)} disabled={isPending}>Voltar</Button>}
            {bankStep < 3 && <Button type="button" onClick={async () => { const fields = bankStep === 1 ? ["name", "code", "catalogId"] : ["pixKey", "pixKeyType"]; const valid = await form.trigger(fields as (keyof CreateBankProps)[]); if (valid) setBankStep((step) => step + 1) }} disabled={isPending}>Continuar</Button>}
            {bankStep === 3 && <Button
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
            </Button>}
          </div>
        </form>
      </Form>
      </div>
    </div>
  )
}
