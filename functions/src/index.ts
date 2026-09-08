import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { setGlobalOptions } from 'firebase-functions/v2'

if (!getApps().length) initializeApp()
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 1 })

type Job = { userId: string; payload: { title: string; body: string; url?: string; notificationId?: string }; status?: string; attempts?: number }

async function sendJob(jobId: string, job: Job) {
  const db = getFirestore()
  const ref = db.collection('_pushOutbox').doc(jobId)
  const claimed = await db.runTransaction(async transaction => {
    const snap = await transaction.get(ref)
    if (!snap.exists || snap.data()?.status !== 'pending') return false
    transaction.update(ref, { status: 'processing', attempts: FieldValue.increment(1), updatedAt: new Date() })
    return true
  })
  if (!claimed) return

  try {
    const user = await db.doc(`users/${job.userId}`).get()
    if (user.data()?.notificationPreferences?.pushEnabled === false) {
      await ref.update({ status: 'sent', sent: 0, skipped: true, updatedAt: new Date() })
      return
    }
    const devices = await db.collection(`users/${job.userId}/pushDevices`).where('enabled', '==', true).get()
    let sent = 0
    for (const device of devices.docs) {
      try {
        await getMessaging().send({ token: device.data().token, notification: { title: job.payload.title, body: job.payload.body }, data: Object.fromEntries(Object.entries(job.payload).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])), webpush: { fcmOptions: job.payload.url ? { link: job.payload.url } : undefined } })
        sent++
      } catch (error) {
        const code = (error as { code?: string }).code
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') await device.ref.delete()
        else console.error('FCM delivery failed', { jobId, deviceId: device.id, code })
      }
    }
    await ref.update({ status: sent > 0 ? 'sent' : 'pending', sent, lastError: sent > 0 ? null : 'Nenhum dispositivo FCM ativo recebeu a mensagem', updatedAt: new Date() })
  } catch (error) {
    await ref.update({ status: 'pending', lastError: error instanceof Error ? error.message : 'Erro desconhecido', updatedAt: new Date() })
    throw error
  }
}

export const processPushOnCreate = onDocumentCreated('_pushOutbox/{jobId}', async event => {
  const job = event.data?.data() as Job | undefined
  if (job) await sendJob(event.params.jobId, job)
})

export const retryPushOutbox = onSchedule({ schedule: 'every 5 minutes', timeZone: 'America/Sao_Paulo' }, async () => {
  const snapshot = await getFirestore().collection('_pushOutbox').where('status', '==', 'pending').limit(50).get()
  for (const doc of snapshot.docs) await sendJob(doc.id, doc.data() as Job)
})
