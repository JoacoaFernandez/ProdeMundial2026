import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendPushToUser } from '@/lib/push'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Context) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const room = await db.room.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      ownerId: true,
      requireApproval: true,
      maxMembers: true,
      _count: { select: { members: { where: { status: 'APPROVED' } } } },
    },
  })

  if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })

  const existing = await db.roomMember.findUnique({
    where: { userId_roomId: { userId: session.user.id, roomId: id } },
  })

  if (existing) {
    if (existing.status === 'APPROVED') {
      return NextResponse.json({ error: 'Ya sos miembro de esta sala' }, { status: 409 })
    }
    if (existing.status === 'PENDING') {
      return NextResponse.json({ error: 'Tu solicitud está pendiente de aprobación' }, { status: 409 })
    }
    // REJECTED — re-allow joining (re-create membership)
    await db.roomMember.delete({ where: { id: existing.id } })
  }

  if (room.maxMembers && room._count.members >= room.maxMembers) {
    return NextResponse.json({ error: 'La sala está llena' }, { status: 409 })
  }

  const status = room.requireApproval ? 'PENDING' : 'APPROVED'

  const member = await db.roomMember.create({
    data: {
      userId: session.user.id,
      roomId: id,
      status,
    },
  })

  const joinerName = session.user.name ?? 'Alguien'
  if (status === 'APPROVED') {
    sendPushToUser(room.ownerId, `${joinerName} se unió a ${room.name}`, '¡Nuevo miembro en tu sala!').catch(() => {})
  } else {
    sendPushToUser(room.ownerId, `Nueva solicitud en ${room.name}`, `${joinerName} quiere unirse. Aprobalo desde la sala.`).catch(() => {})
  }

  return NextResponse.json({
    status: member.status,
    message:
      status === 'PENDING'
        ? 'Solicitud enviada. El dueño de la sala debe aprobarte.'
        : '¡Te uniste a la sala!',
  })
}
