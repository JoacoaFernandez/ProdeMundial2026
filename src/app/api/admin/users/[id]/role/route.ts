import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { role } = await request.json()

  if (role !== 'ADMIN' && role !== 'USER') {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: 'No podés cambiar tu propio rol' }, { status: 400 })
  }

  await db.user.update({ where: { id }, data: { role } })
  return NextResponse.json({ ok: true, role })
}
