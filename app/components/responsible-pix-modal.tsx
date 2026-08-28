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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import Link from "next/link"

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

  const total = details?.totalPending ?? pendingBalance

  // Gerar mensagem de cobrança personalizada com as despesas e chave PIX do banco selecionado
  const billingMessage = useMemo(() => {
    const periodText = month && month !== 'todos' ? ` referente a ${month}${year && year !== 'todos' ? `/${year}` : ''}` : ''

    const lines = debitsList.map(
      (d) => `• ${d.dateFormatted ? d.dateFormatted + ' - ' : ''}${d.description}: ${formatCurrency(d.value)}`
    )

    const bankInfo = selectedBank?.pixKey
      ? `\n🏦 Banco: ${selectedBank.name}\n🔑 Chave PIX (${selectedBank.pixKeyType?.toUpperCase() || 'PIX'}): ${selectedBank.pixKey}`
      : `\n⚠️ Favor solicitar a chave PIX para transferência.`

    return [
      `Olá ${responsibleName}! Segue o extrato de despesas no MeControla.AI${periodText}:`,
      ...lines,
      `---------------------------------`,
      `💰 Total a pagar: ${formatCurrency(total)}`,
      bankInfo,
      `\nObrigado! 🚀`,
    ].join('\n')
  }, [debitsList, total, month, year, responsibleName, selectedBank])

  // Mutation para registrar a Receita de acerto e abater o saldo
  const { mutateAsync: generateCreditMutation, isPending: isGeneratingCredit } = useMutation({
    mutationFn: async () => {
      if (!workspaceActive) return
      return createCredit({
        workspaceId: workspaceActive.id,
        description: `Acerto PIX - ${responsibleName}${month && month !== 'todos' ? ` (${month})` : ''}`,
        value: total,
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
      toast.success(`Receita de ${formatCurrency(total)} gerada com sucesso! Saldo abatido.`)
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
          Cobrar PIX
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[92vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Cobrança PIX: {responsibleName}
          </DialogTitle>
          <DialogDescription>
            Envie o extrato de despesas do responsável e gere a receita de acerto para abater o saldo.
          </DialogDescription>
        </DialogHeader>

        {isDetailsLoading || isBanksLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando extrato de despesas do responsável...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Seletor de Banco para Recebimento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-primary" />
                Banco para Recebimento (Chave PIX):
              </label>

              {banks.length === 0 ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
                  <div className="flex items-center gap-2">
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
                        <div className="flex items-center justify-between w-full gap-4">
                          <span className="font-medium">{bank.name}</span>
                          {bank.pixKey ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
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
            </div>

            {/* Total Balance Card */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Saldo Devedor {month && month !== 'todos' ? `(${month})` : ''}
                </span>
                <div className="text-2xl font-extrabold text-foreground">
                  {formatCurrency(total)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Chave PIX:</span>
                <div className="text-xs font-bold text-primary truncate max-w-[180px]">
                  {selectedBank?.pixKey || "Nenhuma chave no banco"}
                </div>
              </div>
            </div>

            {/* List of Debits */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Despesas Deste Responsável ({debitsList.length})
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
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-medium text-foreground">{d.description}</span>
                        {d.dateFormatted && (
                          <span className="text-[10px] text-muted-foreground ml-2">
                            {d.dateFormatted}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400 shrink-0">
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
                Mensagem Formatada para Cobrança:
              </label>
              <Textarea
                readOnly
                rows={4}
                value={billingMessage}
                className="font-mono text-xs bg-muted/30 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row flex-wrap sm:justify-between items-stretch sm:items-center gap-2 pt-3 border-t">
          {total > 0 && (
            <Button
              type="button"
              onClick={() => generateCreditMutation()}
              disabled={isGeneratingCredit || isDetailsLoading || total <= 0}
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
