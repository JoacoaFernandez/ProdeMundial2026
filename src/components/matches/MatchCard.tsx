import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Prediction = {
  homeScore: number
  awayScore: number
  points: number | null
  category: string | null
}

type MatchCardProps = {
  id: string
  homeTeam: { id?: string; name: string; code: string; flagUrl?: string | null }
  awayTeam: { id?: string; name: string; code: string; flagUrl?: string | null }
  kickoff: string
  lockAt: string
  stage: string
  status: string
  homeScore: number | null
  awayScore: number | null
  isLocked: boolean
  myPrediction: Prediction | null
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Grupo',
  R32: 'Ronda de 32',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semifinal',
  THIRD: '3er puesto',
  FINAL: 'Final',
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  LIVE: 'bg-green-100 text-green-700',
  FINISHED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
  POSTPONED: 'bg-yellow-100 text-yellow-700',
}

const CATEGORY_COLORS: Record<string, string> = {
  EXACT: 'text-green-600',
  WINNER_DIFF: 'text-blue-600',
  WINNER_ONLY: 'text-yellow-600',
  WRONG: 'text-red-500',
}

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  kickoff,
  stage,
  status,
  homeScore,
  awayScore,
  isLocked,
  myPrediction,
}: MatchCardProps) {
  const kickoffDate = new Date(kickoff)
  const isFinished = status === 'FINISHED'
  const isLive = status === 'LIVE'

  return (
    <Link href={`/matches/${id}`}>
      <div className="rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">{STAGE_LABELS[stage] ?? stage}</span>
          <div className="flex items-center gap-2">
            {isLive && <span className="text-xs font-bold text-green-600 animate-pulse">● EN VIVO</span>}
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[status])}>
              {isFinished
                ? 'Finalizado'
                : isLive
                  ? 'En juego'
                  : isLocked
                    ? 'Cerrado'
                    : kickoffDate.toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 text-right">
            <p className="font-semibold text-sm">{homeTeam.name}</p>
            <p className="text-xs text-muted-foreground">{homeTeam.code}</p>
          </div>

          <div className="text-center min-w-[64px]">
            {isFinished || isLive ? (
              <span className="text-xl font-bold tabular-nums">
                {homeScore ?? 0} – {awayScore ?? 0}
              </span>
            ) : (
              <div className="text-sm text-muted-foreground">
                {kickoffDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="font-semibold text-sm">{awayTeam.name}</p>
            <p className="text-xs text-muted-foreground">{awayTeam.code}</p>
          </div>
        </div>

        {/* Prediction row */}
        {myPrediction ? (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Mi pronóstico:{' '}
              <span className="font-mono font-semibold">
                {myPrediction.homeScore} – {myPrediction.awayScore}
              </span>
            </span>
            {myPrediction.points !== null && myPrediction.category ? (
              <span className={cn('font-semibold', CATEGORY_COLORS[myPrediction.category])}>
                +{myPrediction.points} pts
              </span>
            ) : null}
          </div>
        ) : !isLocked && !isFinished ? (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">Sin pronóstico — hacé click para cargar</span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
