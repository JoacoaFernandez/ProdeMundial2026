import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { getFlagUrl } from '@/lib/team-flags'

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Grupos',
  R32: 'R32',
  R16: 'Octavos',
  QF: 'Cuartos',
  SF: 'Semi',
  THIRD: '3er puesto',
  FINAL: 'Final',
}

const CATEGORY_STYLES: Record<string, { label: string; className: string }> = {
  EXACT:       { label: 'Exacto',   className: 'text-green-400 border-green-600/40 bg-green-950/40' },
  WINNER_DIFF: { label: '+Diff',    className: 'text-blue-400 border-blue-600/40 bg-blue-950/40' },
  WINNER_ONLY: { label: 'Ganador',  className: 'text-yellow-400 border-yellow-600/40 bg-yellow-950/40' },
  WRONG:       { label: 'Error',    className: 'text-red-400 border-red-600/40 bg-red-950/40' },
}

export default async function HistoryPage() {
  const session = await auth()

  const predictions = await db.prediction.findMany({
    where: { userId: session!.user.id },
    include: {
      match: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
    orderBy: { match: { kickoff: 'desc' } },
  })

  const scored = predictions.filter((p) => p.points !== null)
  const totalPoints = scored.reduce((sum, p) => sum + (p.points ?? 0), 0)
  const exactCount = scored.filter((p) => p.category === 'EXACT').length
  const pending = predictions.filter((p) => p.points === null).length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mis pronósticos</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{totalPoints}</p>
          <p className="text-xs text-muted-foreground">Puntos totales</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{exactCount}</p>
          <p className="text-xs text-muted-foreground">Exactos</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{predictions.length}</p>
          <p className="text-xs text-muted-foreground">Cargados</p>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          Todavía no cargaste ningún pronóstico.
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map((pred) => {
            const match = pred.match
            const isFinished = match.status === 'FINISHED'
            const cat = pred.category ? CATEGORY_STYLES[pred.category] : null

            return (
              <div key={pred.id} className="rounded-lg border p-3 flex items-center gap-3">
                {/* Teams + result */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    {getFlagUrl(match.homeTeam.code) && (
                      <div className="relative w-6 h-4 rounded-sm overflow-hidden border border-black/10 shrink-0">
                        <Image src={getFlagUrl(match.homeTeam.code, 40)} alt={match.homeTeam.code} fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <span>{match.homeTeam.code}</span>
                    {isFinished ? (
                      <span className="text-muted-foreground tabular-nums">
                        {match.homeScore ?? 0}–{match.awayScore ?? 0}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">vs</span>
                    )}
                    <span>{match.awayTeam.code}</span>
                    {getFlagUrl(match.awayTeam.code) && (
                      <div className="relative w-6 h-4 rounded-sm overflow-hidden border border-black/10 shrink-0">
                        <Image src={getFlagUrl(match.awayTeam.code, 40)} alt={match.awayTeam.code} fill className="object-cover" unoptimized />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {STAGE_LABELS[match.stage] ?? match.stage}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Tu pronóstico:{' '}
                      <span className="font-mono font-semibold text-foreground">
                        {pred.homeScore}–{pred.awayScore}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Points / status */}
                <div className="text-right shrink-0">
                  {isFinished && pred.points !== null ? (
                    <div className="space-y-1 text-right">
                      <p className="text-lg font-bold text-primary">+{pred.points}</p>
                      {cat && (
                        <Badge variant="outline" className={`text-xs ${cat.className}`}>
                          {cat.label}
                        </Badge>
                      )}
                    </div>
                  ) : isFinished ? (
                    <span className="text-xs text-muted-foreground">Calculando...</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pendiente</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
