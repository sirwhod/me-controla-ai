"use client"
import { useEffect, useState } from "react"
import { Bell, Mail } from "lucide-react"
import { PushNotificationRegistration } from "@/app/components/push-notification-registration"

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState({ pushEnabled: true, emailEnabled: true })
  const [saving, setSaving] = useState(false)
  useEffect(() => { fetch('/api/notification-preferences').then(r => r.ok ? r.json() : null).then(data => data && setPreferences(data)).catch(() => undefined) }, [])
  async function update(key: 'pushEnabled' | 'emailEnabled', value: boolean) { setSaving(true); setPreferences(current => ({ ...current, [key]: value })); const response = await fetch('/api/notification-preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) }); if (!response.ok) setPreferences(current => ({ ...current, [key]: !value })); setSaving(false) }
  return <div className="space-y-4"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Bell className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-semibold">Notificações push</p><p className="text-xs text-muted-foreground">Avisos no navegador e no celular.</p></div></div><input aria-label="Notificações push" type="checkbox" checked={preferences.pushEnabled} onChange={event => update('pushEnabled', event.target.checked)} disabled={saving} className="mt-1 h-4 w-4 accent-primary" /></div><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 text-primary" /><div><p className="font-semibold">Notificações por e-mail</p><p className="text-xs text-muted-foreground">Receba comunicações importantes por e-mail.</p></div></div><input aria-label="Notificações por e-mail" type="checkbox" checked={preferences.emailEnabled} onChange={event => update('emailEnabled', event.target.checked)} disabled={saving} className="mt-1 h-4 w-4 accent-primary" /></div><div className="border-t pt-4"><PushNotificationRegistration /></div></div>
}
