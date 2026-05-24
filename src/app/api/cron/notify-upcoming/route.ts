import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 90 * 60 * 1000)

  const upcoming = await db.match.findMany({
    where: {
      kickoff: { gte: windowStart, lte: windowEnd },
      status: 'SCHEDULED',
      notifiedAt: null,
    },
    include: {
      homeTeam: { select: { code: true } },
      awayTeam: { select: { code: true } },
    },
  })

  let notified = 0

  for (const match of upcoming) {
    const home = match.homeTeam.code
    const away = match.awayTeam.code
    const title = `${home} vs ${away} — en ~1 hora`
    const body = '¡Cerramos pronósticos pronto!'
    const url = '/matches?pending=1'

    // Only notify users who haven't predicted this match yet
    const usersWithSubs = await db.pushSubscription.findMany({
      where: {
        user: {
          predictions: { none: { matchId: match.id } },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    await Promise.allSettled(
      usersWithSubs.map(({ userId }) => sendPushToUser(userId, title, body, url))
    )

    await db.match.update({
      where: { id: match.id },
      data: { notifiedAt: new Date() },
    })

    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
