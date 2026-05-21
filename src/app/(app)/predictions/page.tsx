import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { getFlagUrl } from '@/lib/team-flags'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  EXACT:       { label: 'Exacto',       color: 'text-green-500' },
  WINNER_DIFF: { label: '+Diferencia',  color: 'text-blue-500' },
  WINNER_ONLY: { label: 'Ganador',      color: 'text-yellow-500' },
  WRONG:       { label: 'Incorrecto',   color: 'text-red-400' },
}

export default async function PredictionsPage() {
  const session = await auth()

  const predictions = await db.prediction.findMany({
    where: { userId: session!.user.id },
    include: {
      match: {
        include: {
          homeTeam: true,
          awayTeam: true,
        },
      },
    },
    orderBy: { match: { kickoff: 'asc' } },
  })

  const scored = predictions.filter((p) => p.points !== null)
  const pending = predictions.filter((p) => p.points === null)
  const totalPoints = scored.reduce((acc, p) => acc + (p.points ?? 0), 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Mis pronósticos</h1>
        <p className="text-sm text-muted-foreground">
          {predictions.length} pronóstico{predictions.length !== 1 ? 's' : ''} · {totalPoints} puntos acumulados
        </p>
      </div>

      {predictions.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          Todavía no cargaste ningún pronóstico.{' '}
          <Link href="/matches" className="text-primary hover:underline">Ver partidos →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {predictions.map((pred) => {
            const m = pred.match
            const isFinished = m.status === 'FINISHED'
            const cat = pred.category ? CATEGORY_STYLES[pred.category] : null
            const homeFlag = getFlagUrl(m.homeTeam.code, 80)
            const awayFlag = getFlagUrl(m.awayTeam.code, 80)

            return (
              <Link key={pred.id} href={`/matches/${m.id}`}>
                <div className="rounded-lg border p-4 hover:shadow-md transition-shadow flex items-center gap-4">
                  {/* Teams */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative w-8 h-6 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                      {homeFlag && <Image src={homeFlag} alt={m.homeTeam.name} fill className="object-cover" unoptimized />}
                    </div>
                    <span className="text-xs font-bold shrink-0">{m.homeTeam.code}</span>
                    <span className="text-xs text-muted-foreground shrink-0">vs</span>
                    <span className="text-xs font-bold shrink-0">{m.awayTeam.code}</span>
                    <div className="relative w-8 h-6 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                      {awayFlag && <Image src={awayFlag} alt={m.awayTeam.name} fill className="object-cover" unoptimized />}
                    </div>
                  </div>

                  {/* Result vs prediction */}
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
                      <span className={cn('text-xs font-semibold w-20 text-right', cat.color)}>
                        {cat.label} {pred.points !== null ? `+${pred.points}` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground w-20 text-right">Pendiente</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
