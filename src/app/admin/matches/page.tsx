import { db } from '@/lib/db'
import { AdminMatchRow } from './AdminMatchRow'
import { ImportButton } from './ImportButton'
import { RecalculateButton } from './RecalculateButton'

export default async function AdminMatchesPage() {
  const matches = await db.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      _count: { select: { predictions: true } },
    },
    orderBy: { kickoff: 'asc' },
  })

  const hasApiKey = !!process.env.RAPIDAPI_KEY

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Partidos</h1>
        <div className="flex gap-2">
          <RecalculateButton />
          <ImportButton disabled={!hasApiKey} />
        </div>
      </div>

      {!hasApiKey && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          RAPIDAPI_KEY no configurada. Configurá la clave para importar fixtures desde API-Football.
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          No hay partidos. Importalos desde API-Football o cargalos manualmente.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Partido</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Fecha</th>
                <th className="text-left px-4 py-2 font-medium">Estado</th>
                <th className="text-right px-4 py-2 font-medium hidden sm:table-cell">Pronósticos</th>
                <th className="text-right px-4 py-2 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <AdminMatchRow
                  key={match.id}
                  id={match.id}
                  homeTeam={match.homeTeam.code}
                  awayTeam={match.awayTeam.code}
                  kickoff={match.kickoff.toISOString()}
                  status={match.status}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  predictionCount={match._count.predictions}
                  scoredAt={match.scoredAt?.toISOString() ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
