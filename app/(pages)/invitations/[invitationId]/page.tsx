"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Check, Mail, X } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

type Invitation = {
  id: string
  workspaceName: string
  inviterName: string
  inviterEmail: string
  status: string
}

export default function InvitationPage() {
  const params = useParams<{ invitationId: string }>()
  const router = useRouter()
  const [invitation, setInvitation] = React.useState<Invitation | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    fetch("/api/invitations", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.message || "Não foi possível carregar o convite.")
        const found = (data as Invitation[]).find((item) => item.id === params.invitationId)
        if (!found) throw new Error("Este convite não está disponível para esta conta.")
        if (active) setInvitation(found)
      })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o convite.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params.invitationId])

  async function respond(action: "accept" | "reject") {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitationId: params.invitationId, action }) })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.message || "Não foi possível responder ao convite.")
      if (action === "accept" && data?.workspaceId) router.push(`/${data.workspaceId}/dashboard`)
      else setMessage(data?.message || "Convite recusado com sucesso.")
    } catch (respondError) { setError(respondError instanceof Error ? respondError.message : "Não foi possível responder ao convite.") }
    finally { setSubmitting(false) }
  }

  return <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4"><Card className="w-full max-w-lg"><CardHeader className="space-y-4 text-center"><div className="mx-auto rounded-full bg-primary/10 p-3 text-primary"><Mail className="h-7 w-7" /></div><CardTitle className="text-2xl">Convite para participar</CardTitle></CardHeader><CardContent className="space-y-6 text-center">{loading ? <p className="py-6 text-sm text-muted-foreground">Carregando convite...</p> : error ? <div className="space-y-4"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => router.push("/dashboard")}>Ir para o dashboard</Button></div> : message ? <div className="space-y-4"><p className="text-sm text-muted-foreground">{message}</p><Button variant="outline" onClick={() => router.push("/dashboard")}>Voltar ao dashboard</Button></div> : invitation && <><p className="text-muted-foreground"><strong className="text-foreground">{invitation.inviterName}</strong> convidou você para participar da caixinha:</p><div className="rounded-xl border bg-muted/40 p-5 text-lg font-semibold">{invitation.workspaceName}</div><p className="text-sm text-muted-foreground">Ao aceitar, você poderá acompanhar e colaborar com as informações financeiras desta caixinha.</p><div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><Button onClick={() => respond("accept")} disabled={submitting}><Check />Aceitar convite</Button><Button variant="outline" onClick={() => respond("reject")} disabled={submitting}><X />Recusar convite</Button></div></>}</CardContent></Card></main>
}
