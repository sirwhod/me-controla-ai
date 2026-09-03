import { NextRequest, NextResponse } from 'next/server'
import { confirmEmailVerification } from '@/app/lib/email-verification'

export async function POST(request: NextRequest) {
  const token = String((await request.json().catch(() => ({}))).token || '')
  if (!/^[A-Za-z0-9_-]{40,}$/.test(token)) return NextResponse.json({ message: 'Token inválido' }, { status: 400 })
  try { await confirmEmailVerification(token); return NextResponse.json({ message: 'E-mail confirmado com sucesso' }) }
  catch (error) { const message = error instanceof Error && error.message === 'TOKEN_EXPIRED' ? 'Token expirado' : 'Token inválido ou já utilizado'; return NextResponse.json({ message }, { status: 400 }) }
}
