import { db } from '@/lib/db'
import { fetchTodayFixtures, mapStatusToMatchStatus } from '@/lib/football-api'
import { calculatePoints } from '@/lib/scoring'
import { sendPushToUser } from '@/lib/push'
import {
  generateR32,
  generateR16,
  generateQF,
  generateSF,
  generateFinalAndThird,
  isGroupStageComplete,
  isRoundComplete,
} from '@/lib/generate-knockout'
import { broadcastPush } from '@/lib/push'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const leagueId = process.env.FIFA_WORLD_CUP_LEAGUE_ID ?? '1'

  let fixtures
  try {
    fixtures = await fetchTodayFixtures(leagueId)
  } catch (err) {
    console.error('[sync-results] Error fetching fixtures:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 200 })
  }

  let updated = 0
  let scored = 0

  for (const f of fixtures) {
    const status = mapStatusToMatchStatus(f.fixture.status.short)
    const homeScore = f.goals.home
    const awayScore = f.goals.away

    const match = await db.match.findUnique({
      where: { externalId: String(f.fixture.id) },
      include: {
        homeTeam: { select: { code: true } },
        awayTeam: { select: { code: true } },
      },
    })

    if (!match) continue

    const wasFinished = match.status === 'FINISHED' && match.scoredAt !== null
    const isNowFinished = status === 'FINISHED' && homeScore !== null && awayScore !== null

    // Resolve knockoutWinnerId for AET/PEN matches
    let knockoutWinnerId: string | undefined
    if (f.winner === 'HOME_TEAM') knockoutWinnerId = match.homeTeamId
    else if (f.winner === 'AWAY_TEAM') knockoutWinnerId = match.awayTeamId

    await db.match.update({
      where: { id: match.id },
      data: {
        status,
        homeScore,
        awayScore,
        ...(knockoutWinnerId ? { knockoutWinnerId } : {}),
      },
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

            const matchLabel = `${match.homeTeam?.code ?? '?'} ${homeScore}-${awayScore} ${match.awayTeam?.code ?? '?'}`
            const emoji = category === 'EXACT' ? '🎯' : category === 'WINNER_DIFF' ? '✅' : category === 'WINNER_ONLY' ? '👍' : '❌'
            sendPushToUser(pred.userId, `${emoji} +${points} pts`, matchLabel).catch(() => {})
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

  // Auto-generate next knockout round when a stage completes
  if (scored > 0) {
    const roundChecks: Array<[() => Promise<boolean>, () => Promise<{ created: number }>, string, string]> = [
      [isGroupStageComplete, generateR32, '🏆 Ronda de 32 disponible', '¡Hacé tus pronósticos para el Ronda de 32!'],
      [() => isRoundComplete('R32'), generateR16, '⚽ Octavos de final disponibles', '¡Hacé tus pronósticos para Octavos!'],
      [() => isRoundComplete('R16'), generateQF, '⚽ Cuartos de final disponibles', '¡Hacé tus pronósticos para Cuartos!'],
      [() => isRoundComplete('QF'), generateSF, '⚽ Semifinales disponibles', '¡Hacé tus pronósticos para las Semifinales!'],
      [() => isRoundComplete('SF'), generateFinalAndThird, '🏆 Final y 3er puesto disponibles', '¡Hacé tus pronósticos para la Final!'],
    ]
    for (const [check, generate, title, body] of roundChecks) {
      if (await check()) {
        const result = await generate().catch(() => ({ created: 0 }))
        if (result.created > 0) {
          broadcastPush(title, body, '/matches').catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ ok: true, updated, scored })
}
