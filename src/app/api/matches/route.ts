import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // SCHEDULED | LIVE | FINISHED
  const stage = searchParams.get('stage')
  const upcoming = searchParams.get('upcoming') === 'true'

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (stage) where.stage = stage
  if (upcoming) {
    where.status = 'SCHEDULED'
    where.kickoff = { gte: new Date() }
  }

  const matches = await db.match.findMany({
    where,
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId: session.user.id },
        select: { homeScore: true, awayScore: true, points: true, category: true },
      },
    },
    orderBy: { kickoff: 'asc' },
    take: 100,
  })

  const result = matches.map((m) => ({
    id: m.id,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, code: m.homeTeam.code, flagUrl: m.homeTeam.flagUrl },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, code: m.awayTeam.code, flagUrl: m.awayTeam.flagUrl },
    kickoff: m.kickoff,
    lockAt: m.lockAt,
    stage: m.stage,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    venue: m.venue,
    isLocked: new Date() >= m.lockAt,
    myPrediction: m.predictions[0] ?? null,
  }))

  return NextResponse.json(result)
}
