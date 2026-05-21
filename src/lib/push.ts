import webpush from 'web-push'
import { db } from './db'

webpush.setVapidDetails(
  'mailto:prodefifamundial2026@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToUser(userId: string, title: string, body: string) {
  const subs = await db.pushSubscription.findMany({ where: { userId } })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body }),
      ).catch(async (err) => {
        // Suscripción expirada — la borramos
        if (err.statusCode === 410) {
          await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
        }
      })
    )
  )
}

export async function sendPushToAll(title: string, body: string) {
  const subs = await db.pushSubscription.findMany()

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body }),
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
        }
      })
    )
  )
}
