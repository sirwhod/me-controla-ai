import 'server-only'
import webpush from 'web-push'
import { db } from '@/app/lib/firebase'

const publicKey = process.env.WEB_PUSH_PUBLIC_KEY
const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
const subject = process.env.WEB_PUSH_SUBJECT || 'mailto:contato@mecontrolaai.com.br'
if (publicKey && privateKey) webpush.setVapidDetails(subject, publicKey, privateKey)

export type PushSubscriptionRecord = { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string | null }
export async function savePushSubscription(userId: string, subscription: PushSubscriptionRecord) {
  const id = Buffer.from(subscription.endpoint).toString('base64url').slice(0, 120)
  await db.doc(`users/${userId}/pushSubscriptions/${id}`).set({ ...subscription, updatedAt: new Date(), createdAt: new Date() }, { merge: true })
}
export async function removePushSubscription(userId: string, endpoint: string) {
  const id = Buffer.from(endpoint).toString('base64url').slice(0, 120)
  await db.doc(`users/${userId}/pushSubscriptions/${id}`).delete()
}
export async function enqueuePushNotification(userId: string, payload: { title: string; body: string; url?: string; notificationId?: string }) {
  const jobId = `${userId}:${payload.notificationId || Date.now()}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 140)
  await db.collection('_pushOutbox').doc(jobId).set({ userId, payload, status: 'pending', attempts: 0, availableAt: new Date(), createdAt: new Date(), updatedAt: new Date() }, { merge: true })
  return jobId
}

export async function processPushOutbox(limit = 20) {
  if (!publicKey || !privateKey) return []
  const snapshot = await db.collection('_pushOutbox').where('status', '==', 'pending').limit(limit).get()
  const results = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    await doc.ref.update({ status: 'processing', attempts: (data.attempts || 0) + 1, updatedAt: new Date() })
    try { const result = await sendPushNotification(data.userId, data.payload); await doc.ref.update({ status: 'sent', sent: result.sent, updatedAt: new Date() }); results.push({ id: doc.id, status: 'sent' }) }
    catch (error) { await doc.ref.update({ status: 'failed', lastError: error instanceof Error ? error.message : 'Erro desconhecido', updatedAt: new Date() }); results.push({ id: doc.id, status: 'failed' }) }
  }
  return results
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; url?: string; notificationId?: string }) {
  if (!publicKey || !privateKey) return { sent: 0, skipped: true }
  const userSnapshot = await db.doc(`users/${userId}`).get()
  if (userSnapshot.data()?.notificationPreferences?.pushEnabled === false) return { sent: 0, skipped: true }
  const snap = await db.collection(`users/${userId}/pushSubscriptions`).get()
  let sent = 0
  for (const doc of snap.docs) {
    const subscription = doc.data() as PushSubscriptionRecord
    try { await webpush.sendNotification(subscription, JSON.stringify(payload)); sent++ }
    catch (error: unknown) {
      const statusCode = (error as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) await doc.ref.delete()
    }
  }
  return { sent, skipped: false }
}
