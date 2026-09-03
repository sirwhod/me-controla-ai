import type { EmailMessage } from './provider'

type InvitationData = { to: string; inviterName: string; workspaceName: string; invitationId: string; expiresAt: Date }

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character))
}

export function workspaceInvitationEmail(data: InvitationData): EmailMessage {
  const appUrl = process.env.APP_URL
  if (!appUrl) throw new Error('APP_URL não configurada')
  const link = `${appUrl.replace(/\/$/, '')}/invitations/${encodeURIComponent(data.invitationId)}`
  const assetUrl = (process.env.EMAIL_ASSET_URL || appUrl).replace(/\/$/, '')
  const inviter = escapeHtml(data.inviterName)
  const workspace = escapeHtml(data.workspaceName)
  const expires = data.expiresAt.toLocaleDateString('pt-BR')
  return {
    to: data.to,
    subject: `${data.inviterName} convidou você para uma caixinha`,
    html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f7f7f8;font-family:Arial,Helvetica,sans-serif;color:#1f1f24"><div style="padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e8e8eb;border-radius:16px;overflow:hidden"><div style="height:8px;background:#f5b700"></div><div style="padding:28px 32px 12px"><div style="font-size:24px;font-weight:800;letter-spacing:-.5px;color:#24242a"><img src="${assetUrl}/logo.svg" width="32" height="32" alt="" style="vertical-align:middle;margin-right:10px">MeControla<span style="color:#b88400">.AI</span></div></div><div style="padding:12px 32px 32px"><div style="display:inline-block;background:#fff7d6;color:#856300;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700">CONVITE PARA COLABORAR</div><h1 style="font-size:28px;line-height:1.2;margin:20px 0 12px;color:#24242a">Você foi convidado</h1><p style="font-size:16px;line-height:1.6;margin:0 0 8px"><strong>${inviter}</strong> convidou você para participar da caixinha:</p><div style="margin:20px 0;padding:18px;background:#fafafa;border:1px solid #e8e8eb;border-radius:12px;font-size:18px;font-weight:700">${workspace}</div><p style="font-size:14px;line-height:1.6;color:#65656d">Acesse o MeControla.AI para aceitar ou recusar este convite. Ele expira em <strong>${expires}</strong>.</p><p style="margin:28px 0"><a href="${link}" style="display:inline-block;background:#f5b700;color:#4d3800;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Ver convite</a></p><p style="font-size:12px;line-height:1.5;color:#85858d">Se o botão não funcionar, copie e cole este endereço no navegador:<br><span style="word-break:break-all">${link}</span></p></div><div style="border-top:1px solid #eeeeef;padding:18px 32px;font-size:12px;line-height:1.5;color:#85858d">Você recebeu esta mensagem porque alguém informou este endereço em um convite do MeControla.AI.<br>Se você não esperava este convite, ignore este e-mail.</div></div><p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#9a9aa1">MeControla.AI · Organização financeira compartilhada</p></div></body></html>`,
    text: `ME CONTROLA.AI\n\nCONVITE PARA COLABORAR\n\nVocê foi convidado\n\n${data.inviterName} convidou você para participar da caixinha: ${data.workspaceName}.\n\nAcesse o MeControla.AI para aceitar ou recusar este convite. Ele expira em ${expires}.\n\nVer convite: ${link}\n\nSe você não esperava este convite, ignore este e-mail.`,
    idempotencyKey: `workspace-invitation:${data.invitationId}`,
  }
}
