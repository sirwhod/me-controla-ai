"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, Copy, MessageSquareShare, QrCode, Receipt, Sparkles } from "lucide-react"

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
import { getResponsibleDetails } from "@/app/http/responsibles"
import { useWorkspace } from "@/app/hooks/use-workspace"
import { formatCurrency } from "@/app/lib/utils"

interface ResponsiblePixModalProps {
  responsibleId: string
  responsibleName: string
  pendingBalance: number
}

export function ResponsiblePixModal({
  responsibleId,
  responsibleName,
  pendingBalance,
}: ResponsiblePixModalProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { workspaceActive } = useWorkspace()

  const { data: details, isLoading } = useQuery({
    queryKey: ["responsible-details", workspaceActive?.id, responsibleId],
    queryFn: () => getResponsibleDetails(workspaceActive!.id, responsibleId),
    enabled: !!workspaceActive && open,
  })

  const handleCopy = () => {
    if (!details?.formattedBillingMessage) return
    navigator.clipboard.writeText(details.formattedBillingMessage)
    setCopied(true)
    toast.success("Mensagem copiada para a área de transferência!")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsApp = () => {
    if (!details?.formattedBillingMessage) return
    const textEncoded = encodeURIComponent(details.formattedBillingMessage)
    window.open(`https://api.whatsapp.com/send?text=${textEncoded}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
        >
          <QrCode className="h-3.5 w-3.5" />
          Cobrar PIX
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Balanço & Cobrança PIX: {responsibleName}
          </DialogTitle>
          <DialogDescription>
            Gere o texto consolidado com todas as despesas pendentes e sua chave PIX para envio direto.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando extrato do responsável...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total Balance Card */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Saldo Total Devedor
                </span>
                <div className="text-2xl font-extrabold text-foreground">
                  {formatCurrency(details?.totalPending || pendingBalance)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Chave PIX:</span>
                <div className="text-xs font-bold text-primary truncate max-w-[180px]">
                  {details?.pixKey || "Não configurada"}
                </div>
              </div>
            </div>

            {/* List of Pending Expenses */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-1 flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                Despesas em Aberto ({details?.pendingDebits?.length || 0})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1.5 mt-2 pr-1">
                {details?.pendingDebits?.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-medium text-foreground">{d.description}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {d.dateFormatted}
                      </span>
                    </div>
                    <span className="font-bold text-red-500 shrink-0">
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formatted Message Ready to Send */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Mensagem Formatada para WhatsApp:
              </label>
              <Textarea
                readOnly
                rows={5}
                value={details?.formattedBillingMessage || ""}
                className="font-mono text-xs bg-muted/30 resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={isLoading || !details?.formattedBillingMessage}
            className="w-full sm:w-auto gap-1.5"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiado!" : "Copiar Texto"}
          </Button>

          <Button
            type="button"
            onClick={handleWhatsApp}
            disabled={isLoading || !details?.formattedBillingMessage}
            className="w-full sm:w-auto gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <MessageSquareShare className="h-4 w-4" />
            Enviar no WhatsApp
          </Button>

          <DialogClose asChild>
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
