import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const snapshot = await db.doc(`users/${session.user.id}`).get()
  const preferences = snapshot.data()?.notificationPreferences || {}
  return NextResponse.json({ pushEnabled: preferences.pushEnabled !== false, emailEnabled: preferences.emailEnabled !== false })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, boolean> = {}
  if (typeof body.pushEnabled === 'boolean') updates.pushEnabled = body.pushEnabled
  if (typeof body.emailEnabled === 'boolean') updates.emailEnabled = body.emailEnabled
  if (!Object.keys(updates).length) return NextResponse.json({ message: 'Nenhuma preferência válida' }, { status: 400 })
  const firestoreUpdates = Object.fromEntries(Object.entries(updates).map(([key, value]) => [`notificationPreferences.${key}`, value]))
  await db.doc(`users/${session.user.id}`).set({ ...firestoreUpdates, updatedAt: new Date() }, { merge: true })
  return NextResponse.json(updates)
}
