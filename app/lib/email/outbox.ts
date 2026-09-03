import 'server-only'
import { db } from '@/app/lib/firebase'
import { getEmailProvider } from './provider'
import { workspaceInvitationEmail } from './templates'
import { EmailMessage } from './provider'

function verificationEmail(input: { to: string; name: string; token: string }): EmailMessage {
  const appUrl = process.env.APP_URL
  if (!appUrl) throw new Error('APP_URL não configurada')
  const link = `${appUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(input.token)}`
  return { to: input.to, subject: 'Confirme seu e-mail no MeControla.AI', html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#24242a;border-top:8px solid #f5b700"><h1>MeControla.AI</h1><h2>Confirme seu e-mail</h2><p>Olá, ${input.name}. Confirme seu e-mail para proteger sua conta e aceitar convites para caixinhas.</p><p><a href="${link}" style="background:#f5b700;color:#4d3800;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Confirmar e-mail</a></p><p style="font-size:12px;color:#777">Este link expira em 30 minutos.</p></div>`, text: `MeControla.AI\n\nConfirme seu e-mail\n\nOlá, ${input.name}. Acesse: ${link}\n\nEste link expira em 30 minutos.`, idempotencyKey: `email-verification:${input.token}` }
}

export async function enqueueVerificationEmail(input: { to: string; name: string; token: string }) {
  const jobId = `email-verification:${input.to}:${Date.now()}`
  await db.collection('_emailOutbox').doc(jobId).set({ type: 'account.email_verification_requested', toNormalized: input.to, templateData: input, status: 'pending', attempts: 0, availableAt: new Date(), providerMessageId: null, lastError: null, createdAt: new Date(), updatedAt: new Date() })
  return jobId
}

export async function enqueueWorkspaceInvitationEmail(input: Parameters<typeof workspaceInvitationEmail>[0]) {
  const jobId = `workspace-invitation:${input.invitationId}`
  await db.collection('_emailOutbox').doc(jobId).set({
    type: 'workspace.invitation_created',
    toNormalized: input.to,
    templateData: { ...input, expiresAt: input.expiresAt.toISOString() },
    status: 'pending', attempts: 0, availableAt: new Date(),
    providerMessageId: null, lastError: null, createdAt: new Date(), updatedAt: new Date(),
  }, { merge: true })
  return jobId
}

export async function processEmailOutbox(limit = 10, onlyJobId?: string) {
  const snapshot = onlyJobId
    ? await db.collection('_emailOutbox').doc(onlyJobId).get().then(doc => ({ docs: doc.exists ? [doc] : [] }))
    : await db.collection('_emailOutbox').where('status', '==', 'pending').limit(limit).get()
  const results = []
  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (!data) continue
    if (data.status !== 'pending' && !(onlyJobId && data.status === 'failed')) {
      results.push({ id: doc.id, status: data.status })
      continue
    }
    await doc.ref.update({ status: 'processing', updatedAt: new Date(), attempts: (data.attempts || 0) + 1 })
    try {
      const templateData = { ...data.templateData, expiresAt: new Date(data.templateData.expiresAt) }
      const message = data.type === 'workspace.invitation_created' ? workspaceInvitationEmail(templateData) : data.type === 'account.email_verification_requested' ? verificationEmail(templateData) : null
      if (!message) throw new Error(`Tipo de e-mail não suportado: ${data.type}`)
      const sent = await getEmailProvider().send(message)
      await doc.ref.update({ status: 'sent', providerMessageId: sent.id, updatedAt: new Date() })
      results.push({ id: doc.id, status: 'sent' })
    } catch (error) {
      await doc.ref.update({ status: 'failed', lastError: error instanceof Error ? error.message : 'Erro desconhecido', updatedAt: new Date() })
      results.push({ id: doc.id, status: 'failed', error: error instanceof Error ? error.message : 'Erro desconhecido' })
    }
  }
  return results
}
