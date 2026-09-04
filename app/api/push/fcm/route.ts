import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

export async function GET() {
  const session = await auth(); if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const snapshot = await db.collection(`users/${session.user.id}/pushDevices`).get()
  return NextResponse.json({ devices: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), token: undefined })) })
}
export async function POST(req: Request) {
  const session = await auth(); if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const body = await req.json(); if (typeof body?.token !== 'string' || body.token.length < 20) return NextResponse.json({ message: 'Token inválido' }, { status: 400 })
  const id = Buffer.from(body.token).toString('base64url').slice(0, 120)
  await db.doc(`users/${session.user.id}/pushDevices/${id}`).set({ token: body.token, platform: 'web', browser: body.browser || null, userAgent: req.headers.get('user-agent'), enabled: true, lastSeenAt: new Date(), updatedAt: new Date() }, { merge: true })
  return NextResponse.json({ ok: true, id })
}
export async function DELETE(req: Request) {
  const session = await auth(); if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const body = await req.json(); if (typeof body?.id !== 'string' && typeof body?.token !== 'string') return NextResponse.json({ message: 'Dispositivo obrigatório' }, { status: 400 })
  const id = body.id || Buffer.from(body.token).toString('base64url').slice(0, 120)
  await db.doc(`users/${session.user.id}/pushDevices/${id}`).delete(); return NextResponse.json({ ok: true })
}
