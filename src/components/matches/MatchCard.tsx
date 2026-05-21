import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getFlagUrl } from '@/lib/team-flags'

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
  group?: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  isLocked: boolean
  myPrediction: Prediction | null
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de grupos',
  R32: 'Ronda de 32',
  R16: 'Octavos de final',
  QF: 'Cuartos de final',
  SF: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
}

const CATEGORY_STYLES: Record<string, { bar: string; text: string; label: string }> = {
  EXACT:       { bar: 'bg-green-500',  text: 'text-green-600',  label: 'Exacto' },
  WINNER_DIFF: { bar: 'bg-blue-500',   text: 'text-blue-600',   label: '+Diferencia' },
  WINNER_ONLY: { bar: 'bg-yellow-500', text: 'text-yellow-600', label: 'Ganador' },
  WRONG:       { bar: 'bg-red-400',    text: 'text-red-500',    label: 'Incorrecto' },
}

function TeamFlag({ code, name }: { code: string; name: string }) {
  const url = getFlagUrl(code, 80)
  return (
    <div className="flex flex-col items-center gap-2 w-24">
      <div className="relative w-14 h-10 rounded overflow-hidden shadow-sm border border-black/10 bg-muted">
        {url ? (
          <Image
            src={url}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
            {code}
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-bold tracking-wide">{code}</p>
        <p className="text-[10px] text-muted-foreground leading-tight max-w-[80px] truncate">{name}</p>
      </div>
    </div>
  )
}

export function MatchCard({
  id,
  homeTeam,
  awayTeam,
  kickoff,
  stage,
  group,
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
  const cat = isScored && myPrediction?.category ? CATEGORY_STYLES[myPrediction.category] : null

  return (
    <Link href={`/matches/${id}`} className="block group">
      <div className="rounded-xl border bg-card hover:shadow-lg transition-all duration-200 overflow-hidden">
        {/* Top bar — live indicator or category color */}
        <div className={cn(
          'h-1',
          isLive ? 'bg-green-500 animate-pulse' :
          cat ? cat.bar :
          'bg-transparent'
        )} />

        <div className="p-4 space-y-4">
          {/* Stage + date */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stage === 'GROUP' && group ? `Grupo ${group}` : (STAGE_LABELS[stage] ?? stage)}</span>
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <span className="flex items-center gap-1 font-semibold text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  EN VIVO
                </span>
              ) : isFinished ? (
                <span className="text-muted-foreground">Finalizado</span>
              ) : isLocked ? (
                <span className="text-orange-600 font-medium">Cerrado</span>
              ) : (
                <span>
                  {kickoffDate.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' · '}
                  {kickoffDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Teams + score */}
          <div className="flex items-center justify-between gap-2">
            <TeamFlag code={homeTeam.code} name={homeTeam.name} />

            <div className="flex flex-col items-center gap-1 flex-1">
              {isFinished || isLive ? (
                <span className="text-3xl font-bold tabular-nums tracking-tight">
                  {homeScore ?? 0} – {awayScore ?? 0}
                </span>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground tracking-tight">vs</span>
              )}
            </div>

            <TeamFlag code={awayTeam.code} name={awayTeam.name} />
          </div>

          {/* Prediction footer */}
          <div className="border-t pt-3 min-h-[28px]">
            {isScored && cat ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-xs font-semibold', cat.text)}>{cat.label}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({myPrediction!.homeScore}–{myPrediction!.awayScore})
                  </span>
                </div>
                <span className={cn('text-sm font-bold', cat.text)}>+{myPrediction!.points} pts</span>
              </div>
            ) : hasPrediction ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mi pronóstico</span>
                <span className="text-xs font-mono font-semibold">
                  {myPrediction!.homeScore} – {myPrediction!.awayScore}
                </span>
              </div>
            ) : !isLocked && !isFinished ? (
              <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors text-center">
                Tocá para cargar tu pronóstico →
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Sin pronóstico</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
