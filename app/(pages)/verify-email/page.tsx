'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('verificando')
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setStatus('invalid'); return }
    fetch('/api/email-verification/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      .then(response => response.ok ? setStatus('success') : setStatus('invalid'))
      .catch(() => setStatus('invalid'))
  }, [])
  return <main className="flex min-h-screen items-center justify-center bg-background p-6"><section className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">MeControla.AI</h1>{status === 'verificando' && <p className="mt-4 text-muted-foreground">Confirmando seu e-mail...</p>}{status === 'success' && <><h2 className="mt-6 text-xl font-semibold">E-mail confirmado!</h2><p className="mt-2 text-muted-foreground">Sua conta está pronta para aceitar convites.</p><Link className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/sign-in">Entrar na conta</Link></>}{status === 'invalid' && <><h2 className="mt-6 text-xl font-semibold">Link inválido ou expirado</h2><p className="mt-2 text-muted-foreground">Solicite um novo e-mail de confirmação.</p><Link className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground" href="/sign-in">Voltar ao login</Link></>}</section></main>
}
