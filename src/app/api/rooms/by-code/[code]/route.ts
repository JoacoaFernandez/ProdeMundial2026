import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ code: string }> }

export async function GET(_req: Request, { params }: Context) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await params

  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: { where: { status: 'APPROVED' } } } },
    },
  })

  if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })

  const myMembership = await db.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: room.id } },
  })

  return NextResponse.json({
    id: room.id,
    name: room.name,
    code: room.code,
    requireApproval: room.requireApproval,
    owner: room.owner,
    memberCount: room._count.members,
    myStatus: myMembership?.status ?? null,
  })
}
