import 'server-only'
import { getMessaging } from 'firebase-admin/messaging'
import { db } from './firebase'

export type FcmPayload = { title: string; body: string; url?: string; notificationId?: string; type?: string; workspaceId?: string }

export async function sendFcmNotification(userId: string, payload: FcmPayload) {
  const user = await db.doc(`users/${userId}`).get()
  if (user.data()?.notificationPreferences?.pushEnabled === false) return { sent: 0, invalid: 0, skipped: true }
  const devices = await db.collection(`users/${userId}/pushDevices`).where('enabled', '==', true).get()
  let sent = 0; let invalid = 0
  for (const device of devices.docs) {
    const token = device.data().token
    try {
      await getMessaging().send({ token, notification: { title: payload.title, body: payload.body }, data: Object.fromEntries(Object.entries(payload).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])), webpush: { fcmOptions: payload.url ? { link: payload.url } : undefined } })
      sent++
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') { await device.ref.delete(); invalid++ }
      else console.error('Falha FCM', { userId, deviceId: device.id, code })
    }
  }
  return { sent, invalid, skipped: false }
}
