import { db } from '@/lib/db'
import { fetchTodayFixtures, mapStatusToMatchStatus } from '@/lib/football-api'
import { calculatePoints } from '@/lib/scoring'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const leagueId = process.env.FIFA_WORLD_CUP_LEAGUE_ID ?? '1'
  const fixtures = await fetchTodayFixtures(leagueId)

  let updated = 0
  let scored = 0

  for (const f of fixtures) {
    const status = mapStatusToMatchStatus(f.fixture.status.short)
    const homeScore = f.goals.home
    const awayScore = f.goals.away

    const match = await db.match.findUnique({
      where: { externalId: String(f.fixture.id) },
    })

    if (!match) continue

    const wasFinished = match.status === 'FINISHED' && match.scoredAt !== null
    const isNowFinished = status === 'FINISHED' && homeScore !== null && awayScore !== null

    await db.match.update({
      where: { id: match.id },
      data: { status, homeScore, awayScore },
    })
    updated++

    // Solo recalcular si el partido acaba de terminar (no estaba scored antes)
    if (isNowFinished && !wasFinished) {
      const predictions = await db.prediction.findMany({
        where: { matchId: match.id },
      })

      await db.$transaction(async (tx) => {
        for (const pred of predictions) {
          const prev = pred.points ?? 0
          const { points, category } = calculatePoints(
            pred.homeScore,
            pred.awayScore,
            homeScore,
            awayScore,
          )

          await tx.prediction.update({
            where: { id: pred.id },
            data: { points, category },
          })

          const delta = points - prev
          if (delta !== 0) {
            await tx.roomMember.updateMany({
              where: { userId: pred.userId, room: { members: { some: { userId: pred.userId } } } },
              data: {
                totalScore: { increment: delta },
                ...(category === 'EXACT' && prev === 0 ? { exactCount: { increment: 1 } } : {}),
              },
            })
          }
        }

        await tx.match.update({
          where: { id: match.id },
          data: { scoredAt: new Date() },
        })
      })

      scored++
    }
  }

  return NextResponse.json({ ok: true, updated, scored })
}
