import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTeamFlag } from '@/lib/team-flags'

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

const CATEGORY_COLORS: Record<string, string> = {
  EXACT: 'text-green-600',
  WINNER_DIFF: 'text-blue-600',
  WINNER_ONLY: 'text-yellow-600',
  WRONG: 'text-red-500',
}

const CATEGORY_BG: Record<string, string> = {
  EXACT: 'bg-green-50 border-green-200',
  WINNER_DIFF: 'bg-blue-50 border-blue-200',
  WINNER_ONLY: 'bg-yellow-50 border-yellow-200',
  WRONG: 'bg-red-50 border-red-200',
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
  const hasPrediction = myPrediction !== null
  const isScored = hasPrediction && myPrediction!.points !== null

  return (
    <Link href={`/matches/${id}`} className="block group">
      <div className={cn(
        'rounded-xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5',
        isLive && 'border-green-300 bg-green-50/30',
        isScored && myPrediction?.category ? CATEGORY_BG[myPrediction.category] : '',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span className="font-medium">{STAGE_LABELS[stage] ?? stage}</span>
          <div className="flex items-center gap-1.5">
            {isLive && (
              <span className="flex items-center gap-1 text-green-600 font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 inline-block" />
                EN VIVO
              </span>
            )}
            {!isLive && (
              <span className={cn(
                'px-2 py-0.5 rounded-full font-medium',
                isFinished ? 'bg-muted text-muted-foreground' :
                isLocked ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              )}>
                {isFinished ? 'Finalizado' :
                 isLocked ? 'Cerrado' :
                 kickoffDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-1 text-center">
            <span className="text-3xl leading-none">{getTeamFlag(homeTeam.code)}</span>
            <span className="text-xs font-bold tracking-wide">{homeTeam.code}</span>
          </div>

          {/* Score / time */}
          <div className="flex flex-col items-center min-w-[60px]">
            {isFinished || isLive ? (
              <span className="text-2xl font-bold tabular-nums">
                {homeScore ?? 0}–{awayScore ?? 0}
              </span>
            ) : (
              <>
                <span className="text-lg font-semibold tabular-nums">
                  {kickoffDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-muted-foreground">hs</span>
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-1 text-center">
            <span className="text-3xl leading-none">{getTeamFlag(awayTeam.code)}</span>
            <span className="text-xs font-bold tracking-wide">{awayTeam.code}</span>
          </div>
        </div>

        {/* Prediction row */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs min-h-[20px]">
          {isScored && myPrediction?.category ? (
            <>
              <span className="text-muted-foreground font-mono">
                {myPrediction.homeScore}–{myPrediction.awayScore}
              </span>
              <span className={cn('font-bold', CATEGORY_COLORS[myPrediction.category])}>
                +{myPrediction.points} pts
              </span>
            </>
          ) : hasPrediction ? (
            <>
              <span className="text-muted-foreground">Mi pronóstico</span>
              <span className="font-mono font-semibold">
                {myPrediction!.homeScore}–{myPrediction!.awayScore}
              </span>
            </>
          ) : !isLocked && !isFinished ? (
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              Cargá tu pronóstico →
            </span>
          ) : (
            <span className="text-muted-foreground">Sin pronóstico</span>
          )}
        </div>
      </div>
    </Link>
  )
}
