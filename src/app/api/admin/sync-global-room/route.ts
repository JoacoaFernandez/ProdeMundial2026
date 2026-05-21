import { auth } from '@/lib/auth'
import { syncGlobalRoom } from '@/lib/global-room'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 })
  }

  const result = await syncGlobalRoom(session.user.id)
  return NextResponse.json({ ok: true, ...result })
}
