import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { db } from '@/app/lib/firebase'
import { serializeNotification } from '@/app/lib/notifications'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 })
  const url = new URL(req.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 50)
  const unread = url.searchParams.get('unreadOnly') === 'true'
  const cursor = url.searchParams.get('cursor')
  let q = db.collection('users').doc(session.user.id).collection('notifications').where('archivedAt', '==', null).orderBy('createdAt', 'desc').limit(limit)
  if (cursor) {
    const cursorDoc = await db.doc(`users/${session.user.id}/notifications/${cursor}`).get()
    if (!cursorDoc.exists) return NextResponse.json({ message: 'Cursor inválido.' }, { status: 400 })
    q = q.startAfter(cursorDoc)
  }
  if (unread) q = q.where('readAt', '==', null)
  const snap = await q.get()
  return NextResponse.json({ items: snap.docs.map(serializeNotification), nextCursor: snap.docs.length === limit ? snap.docs.at(-1)?.id : null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
