import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GLOBAL_ROOM_CODE } from '@/lib/global-room'

type Props = { searchParams: Promise<{ q?: string }> }

export default async function ExploreRoomsPage({ searchParams }: Props) {
  const session = await auth()
  const { q } = await searchParams

  const rooms = await db.room.findMany({
    where: {
      isPublic: true,
      code: { not: GLOBAL_ROOM_CODE },
      ...(q?.trim() ? { name: { contains: q.trim(), mode: 'insensitive' } } : {}),
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: { where: { status: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const myMemberships = await db.roomMember.findMany({
    where: { userId: session!.user.id, roomId: { in: rooms.map((r) => r.id) } },
    select: { roomId: true, status: true },
  })
  const membershipMap = Object.fromEntries(myMemberships.map((m) => [m.roomId, m.status]))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salas públicas</h1>
          <p className="text-sm text-muted-foreground">
            {rooms.length === 0 ? 'No hay salas públicas todavía' : `${rooms.length} sala${rooms.length !== 1 ? 's' : ''} disponible${rooms.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/rooms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Mis salas
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className={buttonVariants({ size: 'sm' })}
        >
          Buscar
        </button>
      </form>

      {rooms.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          {q ? `No se encontraron salas con "${q}".` : 'No hay salas públicas todavía.'}
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => {
            const myStatus = membershipMap[room.id]
            const isMember = myStatus === 'APPROVED'
            const isPending = myStatus === 'PENDING'
            const isFull = room.maxMembers !== null && room._count.members >= room.maxMembers

            return (
              <div key={room.id} className="rounded-xl border p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{room.name}</p>
                    {room.requireApproval && (
                      <Badge variant="outline" className="text-xs shrink-0">Aprobación</Badge>
                    )}
                    {isFull && (
                      <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground">Llena</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {room.owner.name} · {room._count.members}
                    {room.maxMembers ? `/${room.maxMembers}` : ''} miembro{room._count.members !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="shrink-0">
                  {isMember ? (
                    <Link href={`/rooms/${room.code}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                      Ver sala
                    </Link>
                  ) : isPending ? (
                    <span className="text-xs text-muted-foreground px-3 py-1.5">Pendiente</span>
                  ) : isFull ? (
                    <span className="text-xs text-muted-foreground px-3 py-1.5">Llena</span>
                  ) : (
                    <Link href={`/join/${room.code}`} className={buttonVariants({ size: 'sm' })}>
                      {room.requireApproval ? 'Solicitar' : 'Unirse'}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
