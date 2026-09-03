'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

export function EmailVerificationBanner() {
  const [verified, setVerified] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  useEffect(() => { fetch('/api/email-verification/request').then(response => response.ok ? response.json() : null).then(data => { if (data) setVerified(data.verified) }).catch(() => undefined) }, [])
  if (verified) return null
  async function resend() {
    setSending(true); setSent(false)
    const response = await fetch('/api/email-verification/request', { method: 'POST' })
    setSent(response.ok); setSending(false)
  }
  return <div className="flex flex-col gap-3 border-b border-warning/30 bg-warning/10 px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-warning" /><p><strong>Confirme seu e-mail</strong><br /><span className="text-muted-foreground">Você precisa confirmar seu endereço para aceitar convites.</span></p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={resend} disabled={sending}><RefreshCw data-icon="inline-start" className={sending ? 'animate-spin' : ''} />{sending ? 'Enviando...' : 'Reenviar e-mail'}</Button><Link className="text-xs font-medium underline" href="/verify-email">Saiba mais</Link>{sent && <span className="text-xs text-success">Enviado</span>}</div></div>
}
