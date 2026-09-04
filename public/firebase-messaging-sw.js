/* FCM Web delivers a standard PushEvent. Keeping this worker self-contained avoids
 * third-party script loading being blocked by browser extensions or CSP policies. */
self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() || {} } catch { payload = {} }
  const notification = payload.notification || {}
  const data = payload.data || {}
  const url = payload.fcmOptions?.link || data.url || '/'
  event.waitUntil(self.registration.showNotification(notification.title || 'MeControla.AI', {
    body: notification.body || 'Você tem uma nova notificação.', icon: '/logo.svg', badge: '/logo.svg', data: { url },
  }))
})
self.addEventListener('notificationclick', event => { event.notification.close(); event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => { const target = clients.find(client => 'focus' in client); return target ? target.navigate(event.notification.data?.url || '/') .then(client => client.focus()) : self.clients.openWindow(event.notification.data?.url || '/') })) })
