import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PredictionForm } from '@/components/matches/PredictionForm'
import { getFlagUrl } from '@/lib/team-flags'

type Props = { params: Promise<{ id: string }> }

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de grupos',
  R32: 'Ronda de 32',
  R16: 'Octavos de final',
  QF: 'Cuartos de final',
  SF: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programado',
  LIVE: 'En juego',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
  POSTPONED: 'Postergado',
}

const CATEGORY_INFO: Record<string, { label: string; color: string }> = {
  EXACT: { label: 'Resultado exacto', color: 'text-green-600' },
  WINNER_DIFF: { label: 'Ganador + diferencia', color: 'text-blue-600' },
  WINNER_ONLY: { label: 'Solo ganador / empate', color: 'text-yellow-600' },
  WRONG: { label: 'Incorrecto', color: 'text-red-500' },
}

export default async function MatchDetailPage({ params }: Props) {
  const session = await auth()
  const { id } = await params

  const [match, activeMatchdayRow, userRow] = await Promise.all([
    db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          where: { userId: session!.user.id },
          select: { id: true, homeScore: true, awayScore: true, points: true, category: true, updatedAt: true },
        },
      },
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

  if (!match) notFound()

  const activeMatchday = activeMatchdayRow?.matchday ?? null
  const timezone = userRow?.timezone ?? 'America/Argentina/Buenos_Aires'
  const isFutureMatchday = match.matchday !== null && activeMatchday !== null && match.matchday > activeMatchday
  const isLocked = new Date() >= match.lockAt
  const isFinished = match.status === 'FINISHED'
  const isLive = match.status === 'LIVE'
  const pred = match.predictions[0] ?? null

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/matches" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          ← Partidos
        </Link>
      </div>

      {/* Match header */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{STAGE_LABELS[match.stage] ?? match.stage}</span>
          <div className="flex items-center gap-2">
            {isLive && <span className="text-green-600 font-bold animate-pulse">● EN VIVO</span>}
            <Badge variant="outline">{STATUS_LABELS[match.status]}</Badge>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-16 h-11 rounded overflow-hidden shadow-sm border border-black/10 bg-muted">
              {getFlagUrl(match.homeTeam.code) && (
                <Image src={getFlagUrl(match.homeTeam.code, 80)} alt={match.homeTeam.name} fill className="object-cover" unoptimized />
              )}
            </div>
            <p className="text-lg font-bold">{match.homeTeam.code}</p>
            <p className="text-xs text-muted-foreground text-center">{match.homeTeam.name}</p>
          </div>

          {isFinished || isLive ? (
            <div className="text-center">
              <p className="text-4xl font-bold tabular-nums">
                {match.homeScore ?? 0} – {match.awayScore ?? 0}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-lg font-semibold">
                {new Date(match.kickoff).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: timezone })}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(match.kickoff).toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: timezone,
                })}
              </p>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-16 h-11 rounded overflow-hidden shadow-sm border border-black/10 bg-muted">
              {getFlagUrl(match.awayTeam.code) && (
                <Image src={getFlagUrl(match.awayTeam.code, 80)} alt={match.awayTeam.name} fill className="object-cover" unoptimized />
              )}
            </div>
            <p className="text-lg font-bold">{match.awayTeam.code}</p>
            <p className="text-xs text-muted-foreground text-center">{match.awayTeam.name}</p>
          </div>
        </div>

        {match.venue && (
          <p className="text-xs text-center text-muted-foreground">{match.venue}</p>
        )}
      </div>

      {/* Prediction result (if scored) */}
      {pred && pred.points !== null && pred.category && (
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground mb-1">Tu resultado</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                Pronóstico:{' '}
                <span className="font-mono font-semibold">
                  {pred.homeScore} – {pred.awayScore}
                </span>
              </p>
              <p className={`text-sm font-medium ${CATEGORY_INFO[pred.category]?.color}`}>
                {CATEGORY_INFO[pred.category]?.label}
              </p>
            </div>
            <p className="text-3xl font-bold">+{pred.points}</p>
          </div>
        </div>
      )}

      {/* Prediction form */}
      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-4">
          {isFinished
            ? 'Tu pronóstico'
            : isFutureMatchday
            ? `Disponible en Jornada ${match.matchday}`
            : isLocked
            ? 'Pronóstico cerrado'
            : 'Cargá tu pronóstico'}
        </h2>
        <PredictionForm
          matchId={match.id}
          homeTeamName={match.homeTeam.name}
          awayTeamName={match.awayTeam.name}
          initialHome={pred?.homeScore}
          initialAway={pred?.awayScore}
          isLocked={isLocked || isFinished || isFutureMatchday}
        />
      </div>
    </div>
  )
}
