import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { MatchCard } from '@/components/matches/MatchCard'
import { AdBanner } from '@/components/shared/AdBanner'

export default async function DashboardPage() {
  const session = await auth()

  const [upcomingMatches, myRooms, myPredictionCount, activeMatchdayRow, userRow] = await Promise.all([
    db.match.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE'] },
        kickoff: { gte: new Date() },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { userId: session!.user.id },
          select: { homeScore: true, awayScore: true, points: true, category: true },
        },
      },
      orderBy: { kickoff: 'asc' },
      take: 6,
    }),
    db.roomMember.findMany({
      where: { userId: session!.user.id, status: 'APPROVED' },
      include: {
        room: {
          include: { _count: { select: { members: { where: { status: 'APPROVED' } } } } },
        },
      },
      orderBy: { totalScore: 'desc' },
      take: 3,
    }),
    db.prediction.count({ where: { userId: session!.user.id } }),
    db.match.findFirst({
      where: { status: { notIn: ['FINISHED', 'CANCELLED'] }, matchday: { not: null } },
      orderBy: { matchday: 'asc' },
      select: { matchday: true },
    }),
    db.user.findUnique({
      where: { id: session!.user.id },
      select: { timezone: true },
    }),
  ])

  const activeMatchday = activeMatchdayRow?.matchday ?? null
  const timezone = userRow?.timezone ?? 'America/Argentina/Buenos_Aires'

  const topRoom = myRooms[0] ?? null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">¡Hola, {session!.user.name}!</h1>
        <p className="text-muted-foreground">Bienvenido al PRODE Mundial FIFA 2026</p>
      </div>

      {/* My rooms + stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mis salas</h2>
          <Link href="/rooms" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todas →
          </Link>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/predictions" className="rounded-lg border p-3 hover:shadow-md transition-shadow">
            <p className="text-xs text-muted-foreground">Pronósticos cargados</p>
            <p className="text-2xl font-bold mt-0.5">{myPredictionCount}</p>
          </Link>
          {topRoom ? (
            <Link href={`/rooms/${topRoom.room.code}`} className="rounded-lg border p-3 hover:shadow-md transition-shadow">
              <p className="text-xs text-muted-foreground">Mejor puntaje</p>
              <p className="text-2xl font-bold mt-0.5">{topRoom.totalScore} pts</p>
              <p className="text-xs text-muted-foreground truncate">{topRoom.room.name}</p>
            </Link>
          ) : (
            <Link href="/rooms/new" className="rounded-lg border p-3 hover:shadow-md transition-shadow">
              <p className="text-xs text-muted-foreground">Salas</p>
              <p className="text-sm font-semibold mt-0.5 text-primary">Crear sala →</p>
            </Link>
          )}
        </div>

        {/* Room cards */}
        {myRooms.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/rooms/new" className="rounded-lg border p-4 hover:shadow-md transition-shadow">
              <p className="font-semibold text-sm text-primary">Crear sala →</p>
              <p className="text-xs text-muted-foreground mt-1">Invitá amigos a jugar</p>
            </Link>
            <Link href="/rooms" className="rounded-lg border p-4 hover:shadow-md transition-shadow">
              <p className="font-semibold text-sm text-primary">Unirse a una sala →</p>
              <p className="text-xs text-muted-foreground mt-1">Ingresá con un código</p>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {myRooms.map((m) => (
              <Link key={m.room.id} href={`/rooms/${m.room.code}`}>
                <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <p className="font-semibold text-sm">{m.room.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{m.room.code}</p>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>{m.room._count.members} miembros</span>
                    <span className="font-semibold text-foreground">{m.totalScore} pts</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <AdBanner />

      {/* Upcoming matches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Próximos partidos</h2>
          <Link href="/matches" className="text-sm text-muted-foreground hover:text-foreground">
            Ver todos →
          </Link>
        </div>
        {upcomingMatches.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
            Los fixtures estarán disponibles cuando comience el Mundial.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((m) => (
              <MatchCard
                key={m.id}
                id={m.id}
                homeTeam={{ id: m.homeTeam.id, name: m.homeTeam.name, code: m.homeTeam.code, flagUrl: m.homeTeam.flagUrl }}
                awayTeam={{ id: m.awayTeam.id, name: m.awayTeam.name, code: m.awayTeam.code, flagUrl: m.awayTeam.flagUrl }}
                kickoff={m.kickoff.toISOString()}
                lockAt={m.lockAt.toISOString()}
                stage={m.stage}
                group={m.homeTeam.group ?? null}
                status={m.status}
                homeScore={m.homeScore}
                awayScore={m.awayScore}
                matchday={m.matchday}
                activeMatchday={activeMatchday}
                timezone={timezone}
                isLocked={new Date() >= m.lockAt}
                myPrediction={m.predictions[0] ?? null}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
