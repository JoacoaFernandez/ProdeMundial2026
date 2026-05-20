import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { RoomCard } from '@/components/rooms/RoomCard'
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog'

export default async function RoomsPage() {
  const session = await auth()

  const memberships = await db.roomMember.findMany({
    where: {
      userId: session!.user.id,
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

  const pendingCount = await db.roomMember.count({
    where: { userId: session!.user.id, status: 'PENDING' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis salas</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Tenés {pendingCount} solicitud{pendingCount > 1 ? 'es' : ''} pendiente{pendingCount > 1 ? 's' : ''}.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <JoinRoomDialog />
          <Link href="/rooms/new" className={buttonVariants()}>Nueva sala</Link>
        </div>
      </div>

      {memberships.length === 0 ? (
        <div className="rounded-lg border p-12 text-center space-y-3">
          <p className="text-muted-foreground">No estás en ninguna sala todavía.</p>
          <div className="flex gap-2 justify-center">
            <JoinRoomDialog />
            <Link href="/rooms/new" className={buttonVariants()}>Crear una sala</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => (
            <RoomCard
              key={m.room.id}
              id={m.room.id}
              name={m.room.name}
              code={m.room.code}
              memberCount={m.room._count.members}
              maxMembers={m.room.maxMembers}
              myScore={m.totalScore}
              isOwner={m.room.owner.id === session!.user.id}
              requireApproval={m.room.requireApproval}
            />
          ))}
        </div>
      )}
    </div>
  )
}
