import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculatePoints } from '@/lib/scoring'
import { NextResponse } from 'next/server'
import { z } from 'zod'

type Context = { params: Promise<{ id: string }> }

const UpdateMatchSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED']).optional(),
})

const SetWinnerSchema = z.object({
  knockoutWinnerId: z.string(),
})

export async function PATCH(req: Request, { params }: Context) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  // Handle knockout winner update separately
  if ('knockoutWinnerId' in body) {
    const parsed = SetWinnerSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    await db.match.update({
      where: { id },
      data: { knockoutWinnerId: parsed.data.knockoutWinnerId || null },
    })
    return NextResponse.json({ ok: true })
  }

  const parsed = UpdateMatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { homeScore, awayScore, status = 'FINISHED' } = parsed.data

  const match = await db.match.findUnique({ where: { id } })
  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  // Update match result
  await db.match.update({
    where: { id },
    data: { homeScore, awayScore, status, scoredAt: new Date() },
  })

  // Recalculate all predictions for this match inside a transaction
  const predictions = await db.prediction.findMany({ where: { matchId: id } })

  await db.$transaction(async (tx) => {
    for (const pred of predictions) {
      const { points, category } = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore)

      const prev = await tx.prediction.findUnique({ where: { id: pred.id } })
      const prevPoints = prev?.points ?? 0

      await tx.prediction.update({
        where: { id: pred.id },
        data: { points, category },
      })

      // Update the denormalized score on every room membership for this user
      const memberships = await tx.roomMember.findMany({
        where: { userId: pred.userId, status: 'APPROVED' },
      })

      for (const member of memberships) {
        await tx.roomMember.update({
          where: { id: member.id },
          data: {
            totalScore: { increment: points - prevPoints },
            exactCount: category === 'EXACT' ? { increment: 1 } : undefined,
          },
        })
      }
    }
  })

  return NextResponse.json({ ok: true, predictionsScored: predictions.length })
}
