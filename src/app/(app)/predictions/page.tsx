import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { EditablePredictionRow } from '@/components/predictions/EditablePredictionRow'

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

export default async function PredictionsPage() {
  const session = await auth()
  const now = new Date()

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

  // Group by stage+matchday
  const groupMap = new Map<string, typeof predictions>()
  for (const pred of predictions) {
    const key = pred.match.stage === 'GROUP'
      ? `GROUP-${pred.match.matchday ?? 0}`
      : pred.match.stage
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(pred)
  }

  const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => {
    const aIsGroup = a.startsWith('GROUP-')
    const bIsGroup = b.startsWith('GROUP-')
    if (aIsGroup && bIsGroup) return parseInt(a.split('-')[1]) - parseInt(b.split('-')[1])
    if (aIsGroup) return -1
    if (bIsGroup) return 1
    return GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
  })

  function groupLabel(key: string) {
    if (key.startsWith('GROUP-')) return `Fase de grupos · Fecha ${key.split('-')[1]}`
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
              <div className="flex h-2 rounded-full overflow-hidden gap-px">
                {exactCount > 0 && <div className="bg-green-500" style={{ flex: exactCount }} />}
                {winnerDiffCount > 0 && <div className="bg-blue-500" style={{ flex: winnerDiffCount }} />}
                {winnerOnlyCount > 0 && <div className="bg-yellow-500" style={{ flex: winnerOnlyCount }} />}
                {wrongCount > 0 && <div className="bg-red-400" style={{ flex: wrongCount }} />}
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
                  {preds.map((pred) => (
                    <EditablePredictionRow
                      key={pred.id}
                      matchId={pred.match.id}
                      homeTeam={pred.match.homeTeam}
                      awayTeam={pred.match.awayTeam}
                      matchStatus={pred.match.status}
                      matchHomeScore={pred.match.homeScore}
                      matchAwayScore={pred.match.awayScore}
                      isLocked={now >= pred.match.lockAt}
                      predHomeScore={pred.homeScore}
                      predAwayScore={pred.awayScore}
                      points={pred.points}
                      category={pred.category}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
