import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { MatchList } from '@/components/matches/MatchList'

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>
}) {
  const session = await auth()
  const { pending } = await searchParams
  const pendingOnly = pending === '1'

  const [matches, activeMatchdayRow, userRow] = await Promise.all([
    db.match.findMany({
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { userId: session!.user.id },
          select: { homeScore: true, awayScore: true, points: true, category: true },
        },
      },
      orderBy: { kickoff: 'asc' },
    }),
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

  const serialized = matches.map((m) => ({
    id: m.id,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, code: m.homeTeam.code, flagUrl: m.homeTeam.flagUrl },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, code: m.awayTeam.code, flagUrl: m.awayTeam.flagUrl },
    kickoff: m.kickoff.toISOString(),
    lockAt: m.lockAt.toISOString(),
    stage: m.stage,
    group: m.homeTeam.group ?? null,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    matchday: m.matchday,
    isLocked: new Date() >= m.lockAt,
    myPrediction: m.predictions[0] ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Partidos</h1>
          <p className="text-sm text-muted-foreground">
            {serialized.length === 0
              ? 'Los fixtures se cargarán cuando estén disponibles.'
              : `${serialized.length} partidos`}
          </p>
        </div>
        {!pendingOnly && serialized.length > 0 && (
          <Link
            href="/matches?pending=1"
            className="text-xs text-amber-500 hover:text-amber-400 transition-colors shrink-0 pt-1 font-medium"
          >
            Sin predecir →
          </Link>
        )}
      </div>

      {serialized.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          No hay partidos disponibles todavía.
        </div>
      ) : (
        <MatchList matches={serialized} activeMatchday={activeMatchday} timezone={timezone} pendingOnly={pendingOnly} />
      )}
    </div>
  )
}
