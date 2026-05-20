import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateRoomCode } from '@/lib/room-code'
import { CreateRoomSchema } from '@/lib/validations/room'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await db.roomMember.findMany({
    where: {
      userId: session.user.id,
      status: 'APPROVED',
    },
    include: {
      room: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { members: { where: { status: 'APPROVED' } } } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const rooms = memberships.map((m) => ({
    id: m.room.id,
    name: m.room.name,
    code: m.room.code,
    requireApproval: m.room.requireApproval,
    isPublic: m.room.isPublic,
    maxMembers: m.room.maxMembers,
    owner: m.room.owner,
    memberCount: m.room._count.members,
    myScore: m.totalScore,
    joinedAt: m.joinedAt,
    isOwner: m.room.owner.id === session.user.id,
  }))

  return NextResponse.json(rooms)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateRoomSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { name, requireApproval, isPublic, maxMembers } = parsed.data

  // Generate a unique room code
  let code = generateRoomCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await db.room.findUnique({ where: { code } })
    if (!existing) break
    code = generateRoomCode()
    attempts++
  }

  const room = await db.room.create({
    data: {
      name,
      code,
      ownerId: session.user.id,
      requireApproval,
      isPublic,
      maxMembers,
      members: {
        create: {
          userId: session.user.id,
          status: 'APPROVED',
        },
      },
    },
  })

  return NextResponse.json(room, { status: 201 })
}
