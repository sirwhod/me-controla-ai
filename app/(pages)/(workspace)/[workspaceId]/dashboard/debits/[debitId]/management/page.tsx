"use client"

import Link from "@/app/components/context-link"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/app/lib/axios"
import { formatCurrency } from "@/app/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Check, CheckCircle2, CircleDollarSign, Clock3, ReceiptText, Settings } from "lucide-react"
import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { EditDebit } from "@/app/components/edit-debit"
import type { Debit } from "@/app/types/financial"

type Entry = { id: string; value: number; date: string; status: string; description: string; currentInstallment?: number; totalInstallments?: number }
type Management = { type: string; description: string; entries: Entry[]; totals: { total: number; paid: number; remaining: number } }

export default function DebitManagementPage() {
  const params = useParams<{ workspaceId: string; debitId: string }>()
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")
  const { data, isLoading, error } = useQuery<Management>({
    queryKey: ["debit-management", params.workspaceId, params.debitId],
    queryFn: async () => (await api.get(`/workspaces/${params.workspaceId}/debits/${params.debitId}/management`)).data,
    enabled: !!params.workspaceId && !!params.debitId,
  })

  const currentIndex = data?.entries.findIndex((entry) => entry.id === params.debitId) ?? -1
  const current = currentIndex >= 0 ? data?.entries[currentIndex] : undefined
  const total = data?.totals.total || 0
  const paid = data?.totals.paid || 0
  const remaining = data?.totals.remaining || 0
  const paidPercent = total ? Math.round((paid / total) * 100) : 0
  const currentDebit = current as unknown as Debit | undefined

  async function updateFutureValues() {
    const parsed = Number(value.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return toast.error("Informe um valor válido.")
    try {
      await api.patch(`/workspaces/${params.workspaceId}/debits/${params.debitId}/management`, { value: parsed })
      setValue("")
      await queryClient.invalidateQueries({ queryKey: ["debit-management", params.workspaceId, params.debitId] })
      toast.success("Parcela atual e próximas atualizadas.")
    } catch (err: unknown) {
      const responseMessage = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(responseMessage || "Não foi possível atualizar as parcelas.")
    }
  }

  async function markAsPaid(entryId: string) {
    try {
      await api.patch(`/workspaces/${params.workspaceId}/debits/${entryId}/management`, { status: "paid" })
      await queryClient.invalidateQueries({ queryKey: ["debit-management", params.workspaceId, params.debitId] })
      toast.success("Despesa marcada como paga.")
    } catch (err: unknown) {
      const responseMessage = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(responseMessage || "Não foi possível marcar a despesa como paga.")
    }
  }

  if (isLoading) return <main className="mx-auto max-w-5xl p-6">Carregando gestão da despesa...</main>
  if (error || !data) return <main className="mx-auto max-w-5xl p-6">Não foi possível carregar esta despesa.</main>

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-5 bg-background p-4 pb-12 md:p-8">
      <Link href={`/${params.workspaceId}/dashboard/debits`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para despesas
      </Link>
      <header>
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-sm text-muted-foreground">Gestão da despesa {data.type}</p><h1 className="text-2xl font-bold tracking-tight">{data.description}</h1></div>
          {currentDebit && <EditDebit debit={currentDebit} trigger={<Button variant="outline" size="icon" aria-label="Editar despesa"><Settings data-icon="inline-start" /></Button>} />}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" /> Histórico de pagamentos</CardTitle></CardHeader>
          <CardContent className="max-h-[19rem] space-y-2 overflow-y-auto pr-2">
            {data.entries.map((entry, index) => {
              const isCurrent = index === currentIndex
              const isPaid = entry.status === "paid"
              const isPast = new Date(entry.date).getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
              return <div key={entry.id} className={`flex items-center justify-between rounded-lg border p-3 ${isCurrent ? "border-primary bg-primary/5" : "border-border/60"}`}>
                <div className="flex items-center gap-3">
                  {isPaid ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : isCurrent ? <Clock3 className="h-5 w-5 text-primary" /> : <CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
                  <div><p className="font-medium">{entry.currentInstallment && entry.totalInstallments ? `${entry.currentInstallment}/${entry.totalInstallments}` : format(new Date(entry.date), "MMM/yyyy", { locale: ptBR })} {isCurrent && <Badge className="ml-2">Atual</Badge>}</p><p className="text-xs text-muted-foreground">{format(new Date(entry.date), "dd/MM/yyyy")} · {isPaid ? "Pago" : isCurrent ? "Parcela atual" : "Próximo"}</p></div>
                </div><div className="flex items-center gap-3"><span className="font-semibold">{formatCurrency(Number(entry.value))}</span>{isPast && !isPaid && <Button type="button" size="sm" variant="outline" onClick={() => markAsPaid(entry.id)}><Check data-icon="inline-start" />Marcar paga</Button>}</div>
              </div>
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resumo financeiro</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#22c55e 0 ${paidPercent}%, #f97316 ${paidPercent}% 100%)` }}><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card text-center"><strong className="text-2xl">{paidPercent}%</strong><span className="text-xs text-muted-foreground">pago</span></div></div>
            <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Total devido</span><strong>{formatCurrency(total)}</strong></div><div className="flex justify-between text-emerald-600"><span>Já pago</span><strong>{formatCurrency(paid)}</strong></div><div className="flex justify-between text-orange-600"><span>Falta pagar</span><strong>{formatCurrency(remaining)}</strong></div></div>
            <div className="flex gap-3 text-xs text-muted-foreground"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Pago</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-orange-500" />Falta</span></div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Atualizar valor da parcela atual</CardTitle></CardHeader>
        <CardContent className="space-y-3"><p className="text-sm text-muted-foreground">O histórico já pago será preservado. O novo valor será aplicado à parcela atual e às próximas parcelas em aberto.</p><div className="flex max-w-md gap-2"><Input inputMode="decimal" placeholder={current ? formatCurrency(Number(current.value)) : "Novo valor"} value={value} onChange={(event) => setValue(event.target.value)} /><Button onClick={updateFutureValues}>Aplicar às próximas</Button></div></CardContent>
      </Card>
    </main>
  )
}
