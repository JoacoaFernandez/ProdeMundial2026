import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Context) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const match = await db.match.findUnique({
    where: { id },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId: session.user.id },
        select: { id: true, homeScore: true, awayScore: true, points: true, category: true, updatedAt: true },
      },
    },
  })

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  return NextResponse.json({
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoff: match.kickoff,
    lockAt: match.lockAt,
    stage: match.stage,
    status: match.status,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    venue: match.venue,
    isLocked: new Date() >= match.lockAt,
    myPrediction: match.predictions[0] ?? null,
  })
}
