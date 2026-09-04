'use client'
import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/app/lib/firebase-client'

export function PushNotificationRegistration() {
  const [status, setStatus] = useState<'loading' | 'enabled' | 'disabled' | 'unsupported'>('loading')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!('serviceWorker' in navigator) || !('Notification' in window)) return setStatus('unsupported'); fetch('/api/push/fcm').then(r => r.ok ? r.json() : null).then(data => setStatus(data?.devices?.length ? 'enabled' : 'disabled')).catch(() => setStatus('disabled')) }, [])
  async function toggle() {
    if (busy || status === 'unsupported') return
    setBusy(true)
    try {
      const current = await fetch('/api/push/fcm').then(r => r.json())
      if (current.devices?.length) { await fetch('/api/push/fcm', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: current.devices[0].id }) }); setStatus('disabled'); return }
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
      if (permission !== 'granted') return setStatus('disabled')
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      const messaging = await getFirebaseMessaging(); if (!messaging) throw new Error('FCM não suportado')
      const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
      const response = await fetch('/api/push/fcm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      if (!response.ok) throw new Error('Falha ao registrar dispositivo')
      setStatus('enabled')
    } catch { setStatus('disabled') } finally { setBusy(false) }
  }
  if (status === 'loading') return null
  return <Button variant={status === 'enabled' ? 'outline' : 'default'} size="sm" onClick={toggle} disabled={busy || status === 'unsupported'}><span className="mr-2">{status === 'enabled' ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}</span>{status === 'unsupported' ? 'Não compatível' : status === 'enabled' ? 'Desativar neste dispositivo' : 'Ativar notificações'}</Button>
}
