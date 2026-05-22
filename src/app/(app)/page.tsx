import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { AdBanner } from '@/components/shared/AdBanner'
import { JoinRoomDialog } from '@/components/rooms/JoinRoomDialog'
import { Plus, Trophy, Target, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  const now = new Date()

  const [myRooms, myPredictionCount, myGlobalScore, userRow, pendingMatches, pendingCount] = await Promise.all([
    db.roomMember.findMany({
      where: { userId: session!.user.id, status: 'APPROVED' },
      include: {
        room: {
          include: { _count: { select: { members: { where: { status: 'APPROVED' } } } } },
        },
      },
      orderBy: { totalScore: 'desc' },
    }),
    db.prediction.count({ where: { userId: session!.user.id } }),
    db.roomMember.findFirst({
      where: {
        userId: session!.user.id,
        status: 'APPROVED',
        room: { code: 'GLOBAL' },
      },
      select: { totalScore: true, exactCount: true },
    }),
    db.user.findUnique({
      where: { id: session!.user.id },
      select: { name: true, timezone: true },
    }),
    db.match.findMany({
      where: {
        status: { notIn: ['FINISHED', 'CANCELLED'] },
        lockAt: { gt: now },
        predictions: { none: { userId: session!.user.id } },
      },
      select: {
        id: true,
        kickoff: true,
        homeTeam: { select: { name: true, code: true } },
        awayTeam: { select: { name: true, code: true } },
      },
      orderBy: { kickoff: 'asc' },
      take: 3,
    }),
    db.match.count({
      where: {
        status: { notIn: ['FINISHED', 'CANCELLED'] },
        lockAt: { gt: now },
        predictions: { none: { userId: session!.user.id } },
      },
    }),
  ])

  const privateRooms = myRooms.filter((m) => m.room.code !== 'GLOBAL')
  const timezone = userRow?.timezone ?? 'America/Argentina/Buenos_Aires'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Hola, {(userRow?.name ?? session!.user.name)?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground text-sm">PRODE Mundial FIFA 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{myGlobalScore?.totalScore ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Puntos</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{myGlobalScore?.exactCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Exactos</p>
        </div>
        <div className="rounded-xl border bg-card p-3 text-center">
          <p className="text-2xl font-bold">{myPredictionCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pronósticos</p>
        </div>
      </div>

      {/* Pending predictions */}
      {pendingCount > 0 && (
        <Link href="/matches" className="block rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 hover:bg-amber-500/10 transition-colors">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-500">
                {pendingCount === 1 ? '1 partido sin predecir' : `${pendingCount} partidos sin predecir`}
              </p>
              <div className="mt-2 space-y-1">
                {pendingMatches.map((m) => {
                  const kickoff = new Date(m.kickoff)
                  const label = kickoff.toLocaleDateString('es-AR', {
                    weekday: 'short', day: 'numeric', month: 'short',
                    hour: '2-digit', minute: '2-digit',
                    timeZone: timezone,
                  })
                  return (
                    <p key={m.id} className="text-xs text-muted-foreground truncate">
                      {m.homeTeam.name} vs {m.awayTeam.name}
                      <span className="ml-1 text-amber-500/70">· {label}</span>
                    </p>
                  )
                })}
                {pendingCount > 3 && (
                  <p className="text-xs text-muted-foreground">y {pendingCount - 3} más…</p>
                )}
              </div>
            </div>
            <span className="text-xs text-amber-500 font-medium shrink-0 mt-0.5">Predecir →</span>
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/rooms/new"
          className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 hover:border-primary/50 transition-all"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 mb-3">
            <Plus className="size-5 text-primary" />
          </div>
          <p className="font-bold text-primary">Crear sala</p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            Armá tu grupo y competí con amigos
          </p>
        </Link>

        <JoinRoomDialog asCard />
      </div>

      <AdBanner />

      {/* My rooms */}
      {privateRooms.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Mis salas</h2>
            <Link href="/rooms" className="text-xs text-muted-foreground hover:text-foreground">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2">
            {privateRooms.map((m) => (
              <Link
                key={m.room.id}
                href={`/rooms/${m.room.code}`}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{m.room.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{m.room.code} · {m.room._count.members} miembros</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-bold text-primary">{m.totalScore} pts</p>
                  <p className="text-xs text-muted-foreground">{m.exactCount} exactos</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/ranking"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <Trophy className="size-5 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Ranking global</p>
            <p className="text-xs text-muted-foreground">Todos los jugadores</p>
          </div>
        </Link>
        <Link
          href="/predictions"
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <Target className="size-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium">Mis pronósticos</p>
            <p className="text-xs text-muted-foreground">{myPredictionCount} cargados</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
