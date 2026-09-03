import { NextRequest, NextResponse } from 'next/server'
import { confirmEmailVerification } from '@/app/lib/email-verification'
import { createNotification } from '@/app/lib/notifications'

export async function POST(request: NextRequest) {
  const token = String((await request.json().catch(() => ({}))).token || '')
  if (!/^[A-Za-z0-9_-]{40,}$/.test(token)) return NextResponse.json({ message: 'Token inválido' }, { status: 400 })
  try { const result = await confirmEmailVerification(token); await createNotification({ userId: result.userId, type: 'account.email_verified', category: 'account', title: 'E-mail confirmado', body: 'Seu endereço de e-mail foi confirmado com sucesso.', actionUrl: '/', dedupeKey: `email-verified:${result.userId}` }); return NextResponse.json({ message: 'E-mail confirmado com sucesso' }) }
  catch (error) { const message = error instanceof Error && error.message === 'TOKEN_EXPIRED' ? 'Token expirado' : 'Token inválido ou já utilizado'; return NextResponse.json({ message }, { status: 400 }) }
}
