import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { consumeRateLimit } from '@/app/lib/rate-limit'
import { requestEmailVerification } from '@/app/lib/email-verification'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const limit = await consumeRateLimit('email-verification', session.user.id, 5, 60 * 60 * 1000)
  if (!limit.allowed) return NextResponse.json({ message: 'Aguarde antes de solicitar um novo e-mail' }, { status: 429 })
  try { await requestEmailVerification(session.user.id); return NextResponse.json({ message: 'E-mail de confirmação enviado' }) }
  catch { return NextResponse.json({ message: 'Não foi possível enviar o e-mail de confirmação' }, { status: 500 }) }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const { db } = await import('@/app/lib/firebase')
  const user = await db.collection('users').doc(session.user.id).get()
  const data = user.data()
  return NextResponse.json({ verified: Boolean(data?.emailVerified || data?.emailVerifiedAt), email: session.user.email })
}
