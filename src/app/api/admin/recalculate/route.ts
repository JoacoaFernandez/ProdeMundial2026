import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculatePoints } from '@/lib/scoring'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all finished matches that have scores
  const finishedMatches = await db.match.findMany({
    where: {
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
    },
    include: { predictions: true },
  })

  let totalPredictions = 0

  // Reset all room member scores
  await db.roomMember.updateMany({
    data: { totalScore: 0, exactCount: 0 },
  })

  for (const match of finishedMatches) {
    for (const pred of match.predictions) {
      const { points, category } = calculatePoints(
        pred.homeScore,
        pred.awayScore,
        match.homeScore!,
        match.awayScore!,
      )

      await db.prediction.update({
        where: { id: pred.id },
        data: { points, category },
      })

      const memberships = await db.roomMember.findMany({
        where: { userId: pred.userId, status: 'APPROVED' },
      })

      for (const member of memberships) {
        await db.roomMember.update({
          where: { id: member.id },
          data: {
            totalScore: { increment: points },
            ...(category === 'EXACT' ? { exactCount: { increment: 1 } } : {}),
          },
        })
      }

      totalPredictions++
    }
  }

  return NextResponse.json({ ok: true, matchesProcessed: finishedMatches.length, predictionsScored: totalPredictions })
}
