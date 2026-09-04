'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

export function PushNotificationRegistration() {
  const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled' | 'unsupported'>('loading')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setStatus('unsupported'); navigator.serviceWorker.getRegistration('/sw.js').then(async registration => { const subscription = await registration?.pushManager.getSubscription(); setStatus(subscription ? 'enabled' : 'disabled') }).catch(() => setStatus('disabled')) }, [])
  async function toggle() {
    if (busy || status === 'unsupported') return
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const current = await registration.pushManager.getSubscription()
      if (current) { await fetch('/api/push/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: current.endpoint }) }); await current.unsubscribe(); setStatus('disabled'); return }
      const key = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
      if (!key) return setStatus('disabled')
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
      if (permission !== 'granted') return setStatus('disabled')
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0)) })
      const response = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) })
      if (!response.ok) throw new Error('Falha ao registrar dispositivo')
      setStatus('enabled')
    } catch { setStatus('disabled') } finally { setBusy(false) }
  }
  if (status === 'loading') return null
  return <Button variant={status === 'enabled' ? 'outline' : 'default'} size="sm" onClick={toggle} disabled={busy || status === 'unsupported'}><span className="mr-2">{status === 'enabled' ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>{status === 'unsupported' ? 'Não compatível' : status === 'enabled' ? 'Desativar neste dispositivo' : 'Ativar notificações'}</Button>
}
