import { db } from '@/lib/db'
import Image from 'next/image'
import { getFlagUrl } from '@/lib/team-flags'

type TeamStats = {
  id: string
  name: string
  code: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export default async function GruposPage() {
  const [teams, matches] = await Promise.all([
    db.team.findMany({
      where: { group: { not: null } },
      orderBy: { name: 'asc' },
    }),
    db.match.findMany({
      where: { stage: 'GROUP' },
      include: { homeTeam: true, awayTeam: true },
    }),
  ])

  const statsMap = new Map<string, TeamStats>()
  for (const team of teams) {
    statsMap.set(team.id, {
      id: team.id,
      name: team.name,
      code: team.code,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
    })
  }

  for (const match of matches) {
    if (match.status !== 'FINISHED' || match.homeScore === null || match.awayScore === null) continue

    const home = statsMap.get(match.homeTeamId)
    const away = statsMap.get(match.awayTeamId)
    if (!home || !away) continue

    home.played++; away.played++
    home.gf += match.homeScore; home.ga += match.awayScore
    away.gf += match.awayScore; away.ga += match.homeScore

    if (match.homeScore > match.awayScore) {
      home.won++; home.points += 3; away.lost++
    } else if (match.homeScore < match.awayScore) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; home.points++; away.drawn++; away.points++
    }
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga
  }

  const groupMap = new Map<string, TeamStats[]>()
  for (const team of teams) {
    const g = team.group!
    if (!groupMap.has(g)) groupMap.set(g, [])
    groupMap.get(g)!.push(statsMap.get(team.id)!)
  }

  const groups = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, grpTeams]) => ({
      letter,
      teams: grpTeams.sort((a, b) =>
        b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)
      ),
    }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-sm text-muted-foreground">Tabla de posiciones — los 2 primeros de cada grupo clasifican</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          Los grupos se mostrarán cuando se importe el fixture de la fase de grupos.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(({ letter, teams: grpTeams }) => (
            <div key={letter} className="rounded-xl border overflow-hidden">
              <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-anybody)] font-bold text-primary tracking-wide uppercase">
                  Grupo {letter}
                </h2>
                <span className="text-xs text-muted-foreground">{grpTeams[0]?.played > 0 ? 'En curso' : 'Próximo'}</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">J</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">G</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">E</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">P</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">DG</th>
                    <th className="text-right px-3 py-2 font-medium text-primary">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {grpTeams.map((team, idx) => {
                    const flagUrl = getFlagUrl(team.code, 40)
                    const qualifies = idx < 2
                    return (
                      <tr
                        key={team.id}
                        className={`border-b last:border-0 transition-colors ${
                          qualifies ? 'bg-primary/5' : 'hover:bg-muted/20'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {flagUrl && (
                              <div className="relative w-5 h-3.5 rounded-sm overflow-hidden border border-black/10 shrink-0">
                                <Image src={flagUrl} alt={team.code} fill className="object-cover" unoptimized />
                              </div>
                            )}
                            <span className={qualifies ? 'font-semibold text-primary' : 'text-foreground'}>
                              {team.code}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-1 py-2.5 text-muted-foreground">{team.played}</td>
                        <td className="text-center px-1 py-2.5 text-muted-foreground">{team.won}</td>
                        <td className="text-center px-1 py-2.5 text-muted-foreground">{team.drawn}</td>
                        <td className="text-center px-1 py-2.5 text-muted-foreground">{team.lost}</td>
                        <td className="text-center px-1 py-2.5 text-muted-foreground">
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </td>
                        <td className="text-right px-3 py-2.5 font-bold text-primary">{team.points}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
