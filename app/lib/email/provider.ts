import 'server-only'
import { Resend } from 'resend'

export type EmailMessage = {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  idempotencyKey?: string
}

export type EmailProviderResult = { id: string }

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailProviderResult>
}

class ResendProvider implements EmailProvider {
  private readonly client = new Resend(process.env.RESEND_API_KEY)

  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const result = await this.client.emails.send({
      from: process.env.EMAIL_FROM || 'MeControla.AI <onboarding@resend.dev>',
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo || process.env.EMAIL_REPLY_TO,
      ...(message.idempotencyKey ? { headers: { 'X-Entity-Ref-ID': message.idempotencyKey } } : {}),
    })
    if (result.error || !result.data?.id) throw new Error(result.error?.message || 'Falha ao enviar e-mail')
    return { id: result.data.id }
  }
}

export function getEmailProvider(): EmailProvider {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY não configurada')
  return new ResendProvider()
}
