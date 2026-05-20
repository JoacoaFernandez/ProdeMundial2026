import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Props = { params: Promise<{ code: string }> }

export default async function JoinPage({ params }: Props) {
  const session = await auth()
  const { code } = await params

  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { members: { where: { status: 'APPROVED' } } } },
    },
  })

  if (!room) notFound()

  const existing = await db.roomMember.findUnique({
    where: { userId_roomId: { userId: session!.user.id, roomId: room.id } },
  })

  // Already a member → redirect
  if (existing?.status === 'APPROVED') redirect(`/rooms/${code}`)

  async function joinRoom() {
    'use server'
    const { auth: getAuth } = await import('@/lib/auth')
    const { db: prisma } = await import('@/lib/db')
    const s = await getAuth()
    if (!s) return

    const r = await prisma.room.findUnique({ where: { code: code.toUpperCase() } })
    if (!r) return

    const exists = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: s.user.id, roomId: r.id } },
    })

    if (exists?.status === 'REJECTED') {
      await prisma.roomMember.delete({ where: { id: exists.id } })
    }

    if (!exists || exists.status === 'REJECTED') {
      await prisma.roomMember.create({
        data: {
          userId: s.user.id,
          roomId: r.id,
          status: r.requireApproval ? 'PENDING' : 'APPROVED',
        },
      })
    }

    const { redirect: nav } = await import('next/navigation')
    nav(r.requireApproval ? '/rooms' : `/rooms/${code}`)
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Unirse a una sala</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{room.name}</h2>
              <span className="font-mono text-sm text-muted-foreground">{room.code}</span>
            </div>
            <p className="text-sm text-muted-foreground">Creada por {room.owner.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">{room._count.members} miembros</span>
              {room.requireApproval && <Badge variant="outline">Requiere aprobación</Badge>}
            </div>
          </div>

          {existing?.status === 'PENDING' ? (
            <div className="text-sm text-center text-muted-foreground space-y-2">
              <p>Ya enviaste una solicitud para esta sala.</p>
              <p>El dueño debe aprobarte para que puedas entrar.</p>
              <Link href="/rooms" className={buttonVariants({ variant: 'outline' }) + ' w-full text-center'}>
                Ver mis salas
              </Link>
            </div>
          ) : (
            <form action={joinRoom}>
              <Button type="submit" className="w-full">
                {room.requireApproval ? 'Solicitar unirse' : 'Unirse a la sala'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
