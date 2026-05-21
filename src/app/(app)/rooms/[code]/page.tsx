import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Leaderboard } from '@/components/rooms/Leaderboard'
import { MatchdayPredictions } from '@/components/rooms/MatchdayPredictions'
import { ShareRoomButton } from '@/components/rooms/ShareRoomButton'
import { AdBanner } from '@/components/shared/AdBanner'

type Props = { params: Promise<{ code: string }> }

export default async function RoomPage({ params }: Props) {
  const session = await auth()
  const { code } = await params

  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        where: { status: 'APPROVED' },
        include: { user: { select: { id: true, name: true } } },
        orderBy: [{ totalScore: 'desc' }, { exactCount: 'desc' }],
      },
    },
  })

  if (!room) notFound()

  const isMember = room.members.some((m) => m.userId === session!.user.id)
  const isOwner = room.ownerId === session!.user.id
  const isAdmin = session!.user.role === 'ADMIN'

  if (!isMember && !isAdmin) notFound()

  const myMembership = room.members.find((m) => m.userId === session!.user.id)
  const myRank = myMembership ? room.members.findIndex((m) => m.userId === session!.user.id) + 1 : null

  const leaderboard = room.members.map((m, i) => ({
    rank: i + 1,
    userId: m.userId,
    name: m.user.name,
    totalScore: m.totalScore,
    exactCount: m.exactCount,
    isMe: m.userId === session!.user.id,
  }))

  const memberIds = room.members.map((m) => m.userId)

  // Pending members (only visible to owner/admin) + matchday predictions
  const [pendingMembers, matchdayMatches] = await Promise.all([
    (isOwner || isAdmin)
      ? db.roomMember.findMany({
          where: { roomId: room.id, status: 'PENDING' },
          include: { user: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    db.match.findMany({
      where: { matchday: { not: null } },
      include: {
        homeTeam: { select: { name: true, code: true } },
        awayTeam: { select: { name: true, code: true } },
        predictions: {
          where: { userId: { in: memberIds } },
          select: { userId: true, homeScore: true, awayScore: true, points: true, category: true },
        },
      },
      orderBy: [{ matchday: 'asc' }, { kickoff: 'asc' }],
    }),
  ])

  const matchdayData = matchdayMatches.map((m) => ({
    id: m.id,
    matchday: m.matchday!,
    kickoff: m.kickoff.toISOString(),
    homeTeam: { name: m.homeTeam.name, code: m.homeTeam.code },
    awayTeam: { name: m.awayTeam.name, code: m.awayTeam.code },
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    predictions: m.predictions,
  }))

  const membersData = room.members.map((m) => ({ userId: m.userId, name: m.user.name }))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {room.code}
            </span>
            {room.requireApproval && <Badge variant="outline">Aprobación requerida</Badge>}
            {room.isPublic && <Badge variant="secondary">Pública</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Dueño: {room.owner.name} · {room.members.length} miembro{room.members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShareRoomButton code={room.code} roomName={room.name} />
          {isOwner && (
            <Link href={`/rooms/${code}/settings`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              Configuración
            </Link>
          )}
        </div>
      </div>

      {/* My position */}
      {myMembership && (
        <div className="rounded-lg border p-4 bg-primary/5 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tu posición</p>
            <p className="text-2xl font-bold">#{myRank}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Puntos</p>
            <p className="text-2xl font-bold">{myMembership.totalScore}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Exactos</p>
            <p className="text-2xl font-bold">{myMembership.exactCount}</p>
          </div>
        </div>
      )}

      {/* Pending approvals */}
      {pendingMembers.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Solicitudes pendientes ({pendingMembers.length})</h2>
          {pendingMembers.map((m) => (
            <PendingMemberRow key={m.id} memberId={m.id} roomId={room.id} name={m.user.name} />
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div>
        <h2 className="font-semibold mb-3">Ranking</h2>
        <Leaderboard entries={leaderboard} />
      </div>

      <AdBanner />

      {/* Predicciones por jornada */}
      {matchdayData.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Pronósticos por jornada</h2>
          <MatchdayPredictions
            matches={matchdayData}
            members={membersData}
            myUserId={session!.user.id}
          />
        </div>
      )}
    </div>
  )
}

function PendingMemberRow({ memberId, roomId, name }: { memberId: string; roomId: string; name: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{name}</span>
      <div className="flex gap-2">
        <ApproveButton memberId={memberId} roomId={roomId} action="approve" label="Aprobar" />
        <ApproveButton memberId={memberId} roomId={roomId} action="reject" label="Rechazar" />
      </div>
    </div>
  )
}

function ApproveButton({
  memberId,
  roomId,
  action,
  label,
}: {
  memberId: string
  roomId: string
  action: 'approve' | 'reject'
  label: string
}) {
  async function handleAction() {
    'use server'
    const { db: prisma } = await import('@/lib/db')
    await prisma.roomMember.update({
      where: { id: memberId },
      data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
    })
    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/rooms/[code]`, 'page')
  }

  return (
    <form action={handleAction}>
      <button
        type="submit"
        className={`text-xs px-3 py-1 rounded border font-medium transition-colors ${
          action === 'approve'
            ? 'border-green-600 text-green-700 hover:bg-green-50'
            : 'border-red-400 text-red-600 hover:bg-red-50'
        }`}
      >
        {label}
      </button>
    </form>
  )
}
