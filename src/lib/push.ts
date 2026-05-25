import webpush from 'web-push'
import { db } from './db'

webpush.setVapidDetails(
  'mailto:prodefifamundial2026@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

async function sendToSub(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  return webpush
    .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
    .catch(async (err: { statusCode?: number }) => {
      if (err.statusCode === 410) {
        await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
      }
    })
}

export async function sendPushToUser(userId: string, title: string, body: string, url = '/matches?pending=1') {
  const subs = await db.pushSubscription.findMany({ where: { userId } })
  const payload = JSON.stringify({ title, body, url })
  await Promise.allSettled(subs.map((sub) => sendToSub(sub, payload)))
}

export async function broadcastPush(title: string, body: string, url = '/matches') {
  const subs = await db.pushSubscription.findMany()
  const payload = JSON.stringify({ title, body, url })
  await Promise.allSettled(subs.map((sub) => sendToSub(sub, payload)))
}
