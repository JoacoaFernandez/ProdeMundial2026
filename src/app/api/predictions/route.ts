import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PredictionSchema } from '@/lib/validations/prediction'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = PredictionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { matchId, homeScore, awayScore } = parsed.data

  const [match, activeMatchdayRow] = await Promise.all([
    db.match.findUnique({ where: { id: matchId } }),
    db.match.findFirst({
      where: { status: { notIn: ['FINISHED', 'CANCELLED'] }, matchday: { not: null } },
      orderBy: { matchday: 'asc' },
      select: { matchday: true },
    }),
  ])

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  if (new Date() >= match.lockAt) {
    return NextResponse.json({ error: 'El partido ya está cerrado para pronósticos' }, { status: 403 })
  }

  if (match.status === 'FINISHED' || match.status === 'CANCELLED') {
    return NextResponse.json({ error: 'El partido ya finalizó' }, { status: 403 })
  }

  const activeMatchday = activeMatchdayRow?.matchday ?? null
  if (match.matchday !== null && activeMatchday !== null && match.matchday > activeMatchday) {
    return NextResponse.json({ error: 'Esta jornada aún no está disponible' }, { status: 403 })
  }

  const prediction = await db.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
  })

  return NextResponse.json(prediction)
}
