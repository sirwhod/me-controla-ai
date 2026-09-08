import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import type { DocumentData } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { setGlobalOptions } from 'firebase-functions/v2'

if (!getApps().length) initializeApp()
setGlobalOptions({ region: 'southamerica-east1', maxInstances: 1 })

type Job = { userId: string; payload: { title: string; body: string; url?: string; notificationId?: string }; status?: string; attempts?: number }

const dayKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date)
const dateOnly = (value: unknown) => { const d = value instanceof Date ? value : (value as { toDate?: () => Date })?.toDate?.() || new Date(String(value)); return Number.isNaN(d.getTime()) ? null : d }
const dateDiff = (a: Date, b: Date) => Math.round((new Date(a.toDateString()).getTime() - new Date(b.toDateString()).getTime()) / 86400000)
async function notifyOnce(userId: string, key: string, title: string, body: string, url = '/') {
  const db = getFirestore(); const ref = db.collection('_pushOutbox').doc(`${userId}:${key}`.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 140))
  if ((await ref.get()).exists) return
  await ref.create({ userId, payload: { title, body, url, notificationId: key }, status: 'pending', attempts: 0, availableAt: new Date(), createdAt: new Date(), updatedAt: new Date() })
}
async function workspaceUsers(data: DocumentData) { return [...new Set([data.ownerId, ...(Array.isArray(data.members) ? data.members : [])].filter(Boolean).map(String))] }
async function runFinancialReminders() {
  const db = getFirestore(); const now = new Date(); const today = dayKey(now); const weekday = now.toLocaleDateString('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' })
  const workspaces = await db.collection('workspaces').get()
  for (const workspace of workspaces.docs) {
    const ws = workspace.data(); const users = await workspaceUsers(ws); const base = workspace.ref
    const [goals, debits, cards] = await Promise.all([base.collection('goals').get(), base.collection('debits').get(), base.collection('cards').get()])
    for (const goal of goals.docs) { const g = goal.data(); const end = dateOnly(g.endDate); const progress = Number(g.targetAmount) > 0 ? Number(g.currentAmount || 0) / Number(g.targetAmount) : 0; const recipients = g.userId ? [String(g.userId)] : users; for (const userId of recipients) { if (progress >= 1) await notifyOnce(userId, `goal-complete:${goal.id}:${today}`, 'Meta atingida', `A meta “${g.name || 'Financeira'}” foi atingida.`, `/${workspace.id}/manage/goals`); else if (progress >= .9) await notifyOnce(userId, `goal-near:${goal.id}:${today}`, 'Meta quase concluída', `A meta “${g.name || 'Financeira'}” está a menos de 10% do objetivo.`, `/${workspace.id}/manage/goals`); if (end && dateDiff(end, now) === 1) await notifyOnce(userId, `goal-due:${goal.id}:${today}`, 'Meta próxima do prazo', `A meta “${g.name || 'Financeira'}” vence amanhã.`, `/${workspace.id}/manage/goals`) } }
    for (const debit of debits.docs) { const d = debit.data(); if (d.isTemplate || d.status === 'paid') continue; const due = dateOnly(d.date); if (!due) continue; const delta = dateDiff(due, now); for (const userId of users) { if (delta === 1) await notifyOnce(userId, `debit-due:${debit.id}:${today}`, 'Conta vencendo amanhã', `${d.description || 'Uma conta'} no valor de R$ ${Number(d.value || 0).toFixed(2)} vence amanhã.`, `/${workspace.id}/dashboard/debits`); if (delta === 0) await notifyOnce(userId, `debit-today:${debit.id}:${today}`, 'Conta vence hoje', `${d.description || 'Uma conta'} vence hoje.`, `/${workspace.id}/dashboard/debits`) } }
    for (const card of cards.docs) { const c = card.data(); const due = Number(c.dueDay); const closing = Number(c.closingDay); if (!due || !closing) continue; const day = now.getDate(); for (const userId of users) { if (day === closing) await notifyOnce(userId, `card-close:${card.id}:${today}`, 'Fatura fechada', `A fatura do cartão “${c.name || 'Cartão'}” foi fechada.`, `/${workspace.id}/dashboard`); if (day === due || day + 3 === due) await notifyOnce(userId, `card-due:${card.id}:${today}`, 'Fatura próxima do vencimento', `A fatura do cartão “${c.name || 'Cartão'}” vence ${day === due ? 'hoje' : 'em 3 dias'}.`, `/${workspace.id}/dashboard`) } }
    if (weekday === 'Mon') for (const userId of users) await notifyOnce(userId, `weekly-summary:${today}`, 'Resumo semanal', 'Confira o resumo financeiro da sua caixinha nesta semana.', `/${workspace.id}/dashboard`)
    if (now.getHours() === 8) for (const userId of users) await notifyOnce(userId, `daily-summary:${today}`, 'Resumo financeiro diário', 'Confira as movimentações e o saldo atualizado da sua caixinha.', `/${workspace.id}/dashboard`)
  }
}

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

export const financialReminders = onSchedule({ schedule: 'every 60 minutes', timeZone: 'America/Sao_Paulo' }, runFinancialReminders)
