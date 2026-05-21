'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  async function handleToggle() {
    setWorking(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (status === 'subscribed') {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
        setStatus('unsubscribed')
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') { setStatus('denied'); return }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
        setStatus('subscribed')
      }
    } finally {
      setWorking(false)
    }
  }

  if (status === 'loading' || status === 'unsupported') return null

  return (
    <button
      onClick={handleToggle}
      disabled={working || status === 'denied'}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
        status === 'subscribed'
          ? 'border-primary/40 text-primary hover:bg-primary/10'
          : status === 'denied'
          ? 'border-muted text-muted-foreground cursor-not-allowed'
          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      {status === 'subscribed' ? (
        <><Bell className="size-4" /> Notificaciones activadas</>
      ) : status === 'denied' ? (
        <><BellOff className="size-4" /> Notificaciones bloqueadas</>
      ) : (
        <><Bell className="size-4" /> Activar notificaciones</>
      )}
    </button>
  )
}
