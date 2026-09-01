"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, Copy, Landmark, MessageSquareShare, QrCode, Receipt, Sparkles, AlertCircle, PlusCircle, Loader2 } from "lucide-react"

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
import { Textarea } from "@/app/components/ui/textarea"
import { getResponsibleDetails, ResponsiblePendingDebit } from "@/app/http/responsibles"
import { getBanks } from "@/app/http/banks/get-banks"
import { createCredit } from "@/app/http/credits/create-credit"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { formatCurrency } from "@/app/lib/utils"
import { Bank } from "@/app/types/financial"
import { invalidateFinancialQueries } from "@/app/lib/invalidate-financial-queries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Link from "@/app/components/context-link"

interface ResponsiblePixModalProps {
  responsibleId: string
  responsibleName: string
  pendingBalance: number
  month?: string
  year?: string
}

export function ResponsiblePixModal({
  responsibleId,
  responsibleName,
  pendingBalance,
  month,
  year,
}: ResponsiblePixModalProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState<string>("")
  const { workspaceActive } = useWorkspace()
  const queryClient = useQueryClient()

  // Buscar detalhes do responsável com as despesas do mês/ano
  const { data: details, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["responsible-details", workspaceActive?.id, responsibleId, month, year],
    queryFn: () => getResponsibleDetails(workspaceActive!.id, responsibleId, { month, year }),
    enabled: !!workspaceActive && open,
  })

  // Buscar bancos cadastrados na caixinha para selecionar a chave PIX
  const { data: banks = [], isLoading: isBanksLoading } = useQuery<Bank[]>({
    queryKey: ["banks", workspaceActive?.id],
    queryFn: () => getBanks(workspaceActive!.id),
    enabled: !!workspaceActive && open,
  })

  // Pré-selecionar o primeiro banco com chave PIX cadastrada
  const banksWithPix = useMemo(() => banks.filter(b => !!b.pixKey), [banks])

  useEffect(() => {
    if (open) {
      if (banksWithPix.length > 0 && !selectedBankId) {
        setSelectedBankId(banksWithPix[0].id)
      } else if (banks.length > 0 && !selectedBankId) {
        setSelectedBankId(banks[0].id)
      }
    }
  }, [open, banksWithPix, banks, selectedBankId])

  const selectedBank = useMemo(
    () => banks.find(b => b.id === selectedBankId),
    [banks, selectedBankId]
  )

  const debitsList: ResponsiblePendingDebit[] = useMemo(() => {
    return (details?.pendingDebits || details?.pendingCredits || []) as ResponsiblePendingDebit[]
  }, [details])

  const receivable = details?.receivable ?? details?.totalPending ?? pendingBalance
  const outstandingReceivable = details?.outstandingReceivable ?? details?.totalPending ?? pendingBalance
  const received = details?.received ?? details?.totalCredits ?? 0
  const overpayment = details?.overpayment ?? 0
  const payable = details?.payable ?? 0
  const netBalance = details?.netBalance ?? outstandingReceivable - payable
  const settlementAmount = Math.max(netBalance, 0)
  const receivableDebits = useMemo(() => debitsList.filter((item) => item.debtDirection !== "i_owe_responsible"), [debitsList])
  const payableDebits = useMemo(() => debitsList.filter((item) => item.debtDirection === "i_owe_responsible"), [debitsList])

  // Gerar mensagem de acerto com os valores atribuídos, pagos e ainda pendentes separados.
  const billingMessage = useMemo(() => {
    const periodText = month && month !== 'todos'
      ? ` de ${month}${year && year !== 'todos' ? `/${year}` : ''}`
      : ''

    const bankInfo = selectedBank?.pixKey
      ? [``, `DADOS PARA PAGAMENTO`, `🏦 Banco: ${selectedBank.name}`, `🔑 Chave PIX (${selectedBank.pixKeyType?.toUpperCase() || 'PIX'}): ${selectedBank.pixKey}`]
      : [``, `⚠️ Solicite a chave PIX antes de realizar o pagamento.`]

    const settlementStatus = netBalance > 0
      ? `Após considerar os pagamentos, você ainda precisa pagar ${formatCurrency(netBalance)}.`
      : netBalance < 0
        ? `Após o acerto, eu ainda preciso pagar ${formatCurrency(Math.abs(netBalance))} a você.`
        : outstandingReceivable > 0 || payable > 0
          ? `Os valores se compensam. Não há saldo final pendente.`
          : `Tudo certo: não há nenhum valor pendente neste período.`

    return [
      `Olá ${responsibleName}! Segue o resumo do nosso acerto${periodText} no MeControla.AI.`,
      ``,
      `DESPESAS ATRIBUÍDAS A VOCÊ`,
      ...(receivableDebits.length
        ? receivableDebits.map((d) => `• ${d.dateFormatted ? `${d.dateFormatted} - ` : ''}${d.description}: ${formatCurrency(d.value)}`)
        : [`• Nenhuma despesa`]),
      ``,
      `VALORES QUE EU DEVO A VOCÊ`,
      ...(payableDebits.length
        ? payableDebits.map((d) => `• ${d.dateFormatted ? `${d.dateFormatted} - ` : ''}${d.description}: ${formatCurrency(d.value)}`)
        : [`• Nenhum valor`]),
      ``,
      `RESUMO DO PERÍODO`,
      `🧾 Despesas atribuídas a você: ${formatCurrency(receivable)}`,
      `✅ Pagamentos já registrados em seu nome: ${formatCurrency(received)}`,
      `💰 Valor que você ainda precisa pagar: ${formatCurrency(outstandingReceivable)}`,
      `💸 Valor que eu preciso pagar a você: ${formatCurrency(payable)}`,
      ...(overpayment > 0 ? [`ℹ️ Excedente recebido (não gera dívida): ${formatCurrency(overpayment)}`] : []),
      ``,
      `SITUAÇÃO DO ACERTO`,
      settlementStatus,
      ...(settlementAmount > 0 ? bankInfo : []),
      ``,
      `Obrigado! 🚀`,
    ].join('\n')
  }, [receivableDebits, payableDebits, receivable, received, outstandingReceivable, payable, netBalance, settlementAmount, overpayment, month, year, responsibleName, selectedBank])

  // Mutation para registrar a Receita de acerto e abater o saldo
  const { mutateAsync: generateCreditMutation, isPending: isGeneratingCredit } = useMutation({
    mutationFn: async () => {
      if (!workspaceActive) return
      return createCredit({
        workspaceId: workspaceActive.id,
        description: `Acerto PIX - ${responsibleName}${month && month !== 'todos' ? ` (${month})` : ''}`,
        value: settlementAmount,
        date: new Date().toISOString(),
        paymentMethod: "Pix",
        bankId: selectedBankId || null,
        responsibleId: responsibleId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsibles", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["responsible-details", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["credits", workspaceActive?.id] })
      queryClient.invalidateQueries({ queryKey: ["debits", workspaceActive?.id] })
      void invalidateFinancialQueries(queryClient, workspaceActive?.id)
      toast.success(`Receita de ${formatCurrency(settlementAmount)} gerada com sucesso! Saldo abatido.`)
      setOpen(false)
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao gerar receita de acerto.")
    },
  })

  const handleCopy = () => {
    if (!billingMessage) return
    navigator.clipboard.writeText(billingMessage)
    setCopied(true)
    toast.success("Mensagem copiada para a área de transferência!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsApp = () => {
    if (!billingMessage) return
    const textEncoded = encodeURIComponent(billingMessage)
    window.open(`https://api.whatsapp.com/send?text=${textEncoded}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-semibold cursor-pointer"
        >
          <QrCode className="h-3.5 w-3.5" />
          {pendingBalance > 0 ? "Cobrar PIX" : "Ver acerto"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] min-w-0 max-w-xl overflow-x-hidden overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">
              Acerto com {responsibleName}
            </span>
          </DialogTitle>
          <DialogDescription>
            Confira separadamente as despesas, os pagamentos já registrados e o que ainda está pendente.
          </DialogDescription>
        </DialogHeader>

        {isDetailsLoading || isBanksLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando extrato de despesas do responsável...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Seletor de Banco para Recebimento */}
            {settlementAmount > 0 && <div className="min-w-0 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-primary" />
                Banco para Recebimento (Chave PIX):
              </label>

              {banks.length === 0 ? (
                <div className="flex min-w-0 flex-col items-stretch gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:text-amber-300">
                  <div className="flex min-w-0 items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Nenhum banco cadastrado.</span>
                  </div>
                  <Link href={`/${workspaceActive?.id ? `${workspaceActive.id}/` : ''}manage/banks`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">Cadastrar Banco</Button>
                  </Link>
                </div>
              ) : (
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o banco de destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        <div className="flex min-w-0 w-full items-center justify-between gap-4">
                          <span className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">{bank.name}</span>
                          {bank.pixKey ? (
                            <span className="min-w-0 break-all text-right font-mono text-xs text-emerald-600 dark:text-emerald-400">
                              PIX: {bank.pixKey} ({bank.pixKeyType || "chave"})
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              (Sem PIX configurado)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>}

            {/* Total Balance Card */}
            <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Valor do acerto a receber {month && month !== 'todos' ? `(${month})` : ''}
                </span>
                <div className="text-2xl font-extrabold text-foreground">
                  {formatCurrency(settlementAmount)}
                </div>
                <div className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  Atribuído {formatCurrency(receivable)} · Já pago {formatCurrency(received)}
                </div>
                {payable > 0 && <div className="text-xs text-muted-foreground">Você deve {formatCurrency(payable)} ao responsável.</div>}
                {overpayment > 0 && <div className="text-xs text-muted-foreground">Excedente de {formatCurrency(overpayment)} não gera dívida.</div>}
              </div>
              {settlementAmount > 0 && (
                <div className="min-w-0 text-left sm:text-right">
                  <span className="text-xs text-muted-foreground">Chave PIX:</span>
                  <div className="max-w-full break-all text-xs font-bold text-primary sm:max-w-48">
                    {selectedBank?.pixKey || "Nenhuma chave no banco"}
                  </div>
                </div>
              )}
            </div>

            {/* List of directional debits */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Atribuídas ({receivableDebits.length}) · Devidas ao responsável ({payableDebits.length})
              </h4>
              <div className="max-h-36 overflow-y-auto space-y-1.5 mt-2 pr-1">
                {debitsList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground bg-muted/40 rounded-lg">
                    Nenhuma despesa encontrada para este período.
                  </div>
                ) : (
                  debitsList.map((d) => (
                    <div
                      key={d.id}
                      className="flex min-w-0 items-start justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-2 break-words font-medium text-foreground [overflow-wrap:anywhere]">{d.description}</span>
                        {d.dateFormatted && (
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {d.dateFormatted}
                          </span>
                        )}
                      </div>
                      <span className={d.debtDirection === "i_owe_responsible" ? "font-bold text-rose-600 shrink-0" : "font-bold text-emerald-600 shrink-0"}>
                        {formatCurrency(d.value)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Formatted Message Ready to Send */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Mensagem do acerto:
              </label>
              <Textarea
                readOnly
                rows={4}
                wrap="soft"
                value={billingMessage}
                className="max-w-full resize-none whitespace-pre-wrap break-words bg-muted/30 font-mono text-xs [overflow-wrap:anywhere]"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row flex-wrap sm:justify-between items-stretch sm:items-center gap-2 pt-3 border-t">
          {settlementAmount > 0 && (
            <Button
              type="button"
              onClick={() => generateCreditMutation()}
              disabled={isGeneratingCredit || isDetailsLoading || settlementAmount <= 0}
              className="w-full sm:w-auto gap-1.5 font-bold cursor-pointer shrink-0"
            >
              {isGeneratingCredit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              Registrar Receita & Abater Saldo
            </Button>
          )}

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isDetailsLoading || !billingMessage}
              className="flex-1 sm:flex-initial gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleWhatsApp}
              disabled={isDetailsLoading || !billingMessage}
              className="flex-1 sm:flex-initial gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
            >
              <MessageSquareShare className="h-4 w-4" />
              WhatsApp
            </Button>

            <DialogClose asChild>
              <Button type="button" size="sm" variant="secondary" className="cursor-pointer">
                Fechar
              </Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
