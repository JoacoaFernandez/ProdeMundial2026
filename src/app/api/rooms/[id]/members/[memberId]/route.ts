import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

type Context = { params: Promise<{ id: string; memberId: string }> }

export async function PATCH(req: Request, { params }: Context) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, memberId } = await params
  const { action } = await req.json() as { action: 'approve' | 'reject' }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  }

  const room = await db.room.findUnique({ where: { id } })
  if (!room) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 })

  if (room.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo el dueño puede gestionar miembros' }, { status: 403 })
  }

  const member = await db.roomMember.findUnique({ where: { id: memberId } })
  if (!member || member.roomId !== id) {
    return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
  }

  const updated = await db.roomMember.update({
    where: { id: memberId },
    data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
  })

  return NextResponse.json(updated)
}
