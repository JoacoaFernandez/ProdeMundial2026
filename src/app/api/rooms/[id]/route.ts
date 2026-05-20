import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Context) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const room = await db.room.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ totalScore: 'desc' }, { exactCount: 'desc' }],
      },
    },
  })

  if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })

  const isMember = room.members.some((m) => m.userId === session.user.id)
  const isAdmin = session.user.role === 'ADMIN'

  if (!isMember && !isAdmin) {
    return NextResponse.json({ error: 'No pertenecés a esta sala' }, { status: 403 })
  }

  const myMembership = room.members.find((m) => m.userId === session.user.id)

  return NextResponse.json({
    id: room.id,
    name: room.name,
    code: room.code,
    requireApproval: room.requireApproval,
    isPublic: room.isPublic,
    maxMembers: room.maxMembers,
    owner: room.owner,
    isOwner: room.ownerId === session.user.id,
    leaderboard: room.members.map((m, i) => ({
      rank: i + 1,
      userId: m.userId,
      name: m.user.name,
      totalScore: m.totalScore,
      exactCount: m.exactCount,
      isMe: m.userId === session.user.id,
    })),
    myRank: myMembership
      ? room.members.findIndex((m) => m.userId === session.user.id) + 1
      : null,
    myScore: myMembership?.totalScore ?? 0,
  })
}
