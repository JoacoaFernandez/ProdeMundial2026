import { db } from '@/lib/db'
import { sendPushToAll } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const now = new Date()
  // Window: matches starting between 55 and 90 minutes from now
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 90 * 60 * 1000)

  const upcoming = await db.match.findMany({
    where: {
      kickoff: { gte: windowStart, lte: windowEnd },
      status: 'SCHEDULED',
      notifiedAt: null,
    },
    include: {
      homeTeam: { select: { code: true, name: true } },
      awayTeam: { select: { code: true, name: true } },
    },
  })

  let notified = 0

  for (const match of upcoming) {
    const home = match.homeTeam.code
    const away = match.awayTeam.code
    const title = `${home} vs ${away} — en ~1 hora`
    const body = '¡Hacé tu pronóstico antes de que cierre!'

    try {
      await sendPushToAll(title, body)
      await db.match.update({
        where: { id: match.id },
        data: { notifiedAt: new Date() },
      })
      notified++
    } catch (err) {
      console.error(`[notify-upcoming] Error notifying for match ${match.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, notified })
}
