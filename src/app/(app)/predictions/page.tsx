import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-flags'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CATEGORY_STYLES: Record<string, { label: string; color: string; bar: string }> = {
  EXACT:       { label: 'Exacto',      color: 'text-green-500',  bar: 'bg-green-500' },
  WINNER_DIFF: { label: '+Diferencia', color: 'text-blue-500',   bar: 'bg-blue-500' },
  WINNER_ONLY: { label: 'Ganador',     color: 'text-yellow-500', bar: 'bg-yellow-500' },
  WRONG:       { label: 'Incorrecto',  color: 'text-red-400',    bar: 'bg-red-400' },
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

const GROUP_ORDER = ['GROUP', 'R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL']

type GroupKey = { stage: string; matchday?: number | null }

export default async function PredictionsPage() {
  const session = await auth()

  const predictions = await db.prediction.findMany({
    where: { userId: session!.user.id },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: { match: { kickoff: 'asc' } },
  })

  const scored = predictions.filter((p) => p.points !== null)
  const totalPoints = scored.reduce((acc, p) => acc + (p.points ?? 0), 0)
  const exactCount = scored.filter((p) => p.category === 'EXACT').length
  const winnerDiffCount = scored.filter((p) => p.category === 'WINNER_DIFF').length
  const winnerOnlyCount = scored.filter((p) => p.category === 'WINNER_ONLY').length
  const wrongCount = scored.filter((p) => p.category === 'WRONG').length
  const pendingCount = predictions.filter((p) => p.points === null).length

  // Group predictions by stage+matchday
  const groupMap = new Map<string, typeof predictions>()
  for (const pred of predictions) {
    const key = pred.match.stage === 'GROUP'
      ? `GROUP-${pred.match.matchday ?? 0}`
      : pred.match.stage
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(pred)
  }

  // Sort groups: group stage matchdays first, then knockout order
  const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => {
    const aIsGroup = a.startsWith('GROUP-')
    const bIsGroup = b.startsWith('GROUP-')
    if (aIsGroup && bIsGroup) {
      return parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])
    }
    if (aIsGroup) return -1
    if (bIsGroup) return 1
    return GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
  })

  function groupLabel(key: string) {
    if (key.startsWith('GROUP-')) {
      const day = key.split('-')[1]
      return `Fase de grupos · Fecha ${day}`
    }
    return STAGE_LABELS[key] ?? key
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Mis pronósticos</h1>
        <p className="text-sm text-muted-foreground">
          {predictions.length} cargados · {pendingCount > 0 ? `${pendingCount} pendientes de resultado` : 'todos puntuados'}
        </p>
      </div>

      {/* Stats grid */}
      {predictions.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-3xl font-bold">{totalPoints}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Puntos totales</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-3xl font-bold">{scored.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Puntuados</p>
            </div>
          </div>

          {scored.length > 0 && (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Desglose</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-xl font-bold text-green-500">{exactCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Exacto</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-blue-500">{winnerDiffCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">+Dif.</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-yellow-500">{winnerOnlyCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Ganador</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-400">{wrongCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Mal</p>
                </div>
              </div>

              {/* Bar breakdown */}
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {exactCount > 0 && (
                  <div className="bg-green-500" style={{ flex: exactCount }} />
                )}
                {winnerDiffCount > 0 && (
                  <div className="bg-blue-500" style={{ flex: winnerDiffCount }} />
                )}
                {winnerOnlyCount > 0 && (
                  <div className="bg-yellow-500" style={{ flex: winnerOnlyCount }} />
                )}
                {wrongCount > 0 && (
                  <div className="bg-red-400" style={{ flex: wrongCount }} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {predictions.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          Todavía no cargaste ningún pronóstico.{' '}
          <Link href="/matches" className="text-primary hover:underline">Ver partidos →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedKeys.map((key) => {
            const preds = groupMap.get(key)!
            const groupPoints = preds.reduce((acc, p) => acc + (p.points ?? 0), 0)
            const groupScored = preds.filter((p) => p.points !== null).length

            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {groupLabel(key)}
                  </p>
                  {groupScored > 0 && (
                    <p className="text-xs font-semibold text-primary">{groupPoints} pts</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  {preds.map((pred) => {
                    const m = pred.match
                    const isFinished = m.status === 'FINISHED'
                    const cat = pred.category ? CATEGORY_STYLES[pred.category] : null
                    const homeFlag = getFlagUrl(m.homeTeam.code, 80)
                    const awayFlag = getFlagUrl(m.awayTeam.code, 80)

                    return (
                      <Link key={pred.id} href={`/matches/${m.id}`} className="block">
                        <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
                          {cat && <div className={cn('h-0.5', cat.bar)} />}
                          <div className="px-4 py-3 flex items-center gap-3">
                            {/* Teams */}
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                                {homeFlag && <Image src={homeFlag} alt={m.homeTeam.name} fill className="object-cover" unoptimized />}
                              </div>
                              <span className="text-xs font-bold shrink-0">{m.homeTeam.code}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">vs</span>
                              <span className="text-xs font-bold shrink-0">{m.awayTeam.code}</span>
                              <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                                {awayFlag && <Image src={awayFlag} alt={m.awayTeam.name} fill className="object-cover" unoptimized />}
                              </div>
                            </div>

                            {/* Scores + category */}
                            <div className="flex items-center gap-3 shrink-0">
                              {isFinished && (
                                <span className="text-xs text-muted-foreground font-mono">
                                  {m.homeScore}–{m.awayScore}
                                </span>
                              )}
                              <span className="text-sm font-mono font-bold">
                                {pred.homeScore}–{pred.awayScore}
                              </span>
                              {cat ? (
                                <span className={cn('text-xs font-semibold w-[72px] text-right', cat.color)}>
                                  {cat.label} {pred.points !== null ? `+${pred.points}` : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground w-[72px] text-right">Pendiente</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
