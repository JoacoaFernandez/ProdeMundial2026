import React from 'react'
import Link from 'next/link'
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

function getGroupStatus(teams: TeamStats[], totalMatches: number, finishedMatches: number): 'Próximo' | 'En curso' | 'Finalizado' {
  if (finishedMatches === 0) return 'Próximo'
  if (finishedMatches >= totalMatches) return 'Finalizado'
  return 'En curso'
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

  // Track finished matches per group
  const groupFinishedCounts = new Map<string, number>()
  const groupTotalCounts = new Map<string, number>()

  for (const match of matches) {
    const homeTeam = teams.find(t => t.id === match.homeTeamId)
    const awayTeam = teams.find(t => t.id === match.awayTeamId)
    const groupKey = homeTeam?.group ?? awayTeam?.group
    if (!groupKey) continue

    groupTotalCounts.set(groupKey, (groupTotalCounts.get(groupKey) ?? 0) + 1)
    if (match.status === 'FINISHED') {
      groupFinishedCounts.set(groupKey, (groupFinishedCounts.get(groupKey) ?? 0) + 1)
    }

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
      status: getGroupStatus(
        grpTeams,
        groupTotalCounts.get(letter) ?? 6,
        groupFinishedCounts.get(letter) ?? 0,
      ),
    }))

  // Best thirds: top 8 third-placed teams qualify in 2026 format (12 groups)
  const allThirds = groups
    .filter(g => g.teams.length >= 3)
    .map(g => ({ ...g.teams[2], group: g.letter }))
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name))

  const qualifyingThirds = allThirds.slice(0, 8)
  const qualifyingThirdIds = new Set(qualifyingThirds.map(t => t.id))

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Grupos</h1>
          <p className="text-sm text-muted-foreground">Clasifican los 2 primeros de cada grupo + los 8 mejores terceros</p>
        </div>
        <Link
          href="/bracket"
          className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 pt-1"
        >
          Ver Llaves →
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          Los grupos se mostrarán cuando se importe el fixture de la fase de grupos.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map(({ letter, teams: grpTeams, status }) => (
              <div key={letter} className="rounded-xl border overflow-hidden">
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between">
                  <h2 className="font-[family-name:var(--font-anybody)] font-bold text-primary tracking-wide uppercase">
                    Grupo {letter}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    status === 'Finalizado'
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                      : status === 'En curso'
                        ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                        : 'text-muted-foreground'
                  }`}>
                    {status}
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Equipo</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">J</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">G</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">E</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">P</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">GF</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">GC</th>
                      <th className="text-center px-1 py-2 font-medium text-muted-foreground">DG</th>
                      <th className="text-right px-3 py-2 font-medium text-primary">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grpTeams.map((team, idx) => {
                      const flagUrl = getFlagUrl(team.code, 40)
                      const directQualifies = idx < 2
                      const isThird = idx === 2
                      const thirdQualifies = isThird && qualifyingThirdIds.has(team.id)
                      const rowBg = directQualifies
                        ? 'bg-primary/5'
                        : thirdQualifies
                          ? 'bg-orange-500/5'
                          : 'hover:bg-muted/20'
                      const nameColor = directQualifies
                        ? 'font-semibold text-primary'
                        : thirdQualifies
                          ? 'font-semibold text-orange-500'
                          : 'text-foreground'

                      return (
                        <React.Fragment key={team.id}>
                          {/* Separator line between 2nd and 3rd */}
                          {idx === 2 && (
                            <tr className="border-b-2 border-primary/20" />
                          )}
                          <tr
                            className={`border-b last:border-0 transition-colors ${rowBg}`}
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                {flagUrl && (
                                  <div className="relative w-5 h-3.5 rounded-sm overflow-hidden border border-black/10 shrink-0">
                                    <Image src={flagUrl} alt={team.code} fill className="object-cover" unoptimized />
                                  </div>
                                )}
                                <span className={nameColor}>{team.code}</span>
                              </div>
                            </td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.played}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.won}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.drawn}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.lost}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.gf}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">{team.ga}</td>
                            <td className="text-center px-1 py-2.5 text-muted-foreground">
                              {team.gd > 0 ? `+${team.gd}` : team.gd}
                            </td>
                            <td className="text-right px-3 py-2.5 font-bold text-primary">{team.points}</td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Best thirds section */}
          {allThirds.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-2.5 flex items-center justify-between">
                <h2 className="font-[family-name:var(--font-anybody)] font-bold text-orange-500 tracking-wide uppercase">
                  Mejores Terceros
                </h2>
                <span className="text-xs text-muted-foreground">Clasifican los 8 mejores</span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground w-8">#</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Equipo</th>
                    <th className="text-center px-2 py-2 font-medium text-muted-foreground">Grupo</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">J</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">G</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">E</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">P</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">GF</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">GC</th>
                    <th className="text-center px-1 py-2 font-medium text-muted-foreground">DG</th>
                    <th className="text-right px-3 py-2 font-medium text-primary">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {allThirds.map((team, idx) => {
                    const flagUrl = getFlagUrl(team.code, 40)
                    const qualifies = idx < 8
                    return (
                      <React.Fragment key={team.id}>
                        {idx === 8 && (
                          <tr className="border-b-2 border-orange-500/30" />
                        )}
                        <tr
                          className={`border-b last:border-0 transition-colors ${
                            qualifies ? 'bg-orange-500/5' : 'hover:bg-muted/20'
                          }`}
                        >
                          <td className="text-center px-3 py-2.5 text-muted-foreground font-medium">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {flagUrl && (
                                <div className="relative w-5 h-3.5 rounded-sm overflow-hidden border border-black/10 shrink-0">
                                  <Image src={flagUrl} alt={team.code} fill className="object-cover" unoptimized />
                                </div>
                              )}
                              <span className={qualifies ? 'font-semibold text-orange-500' : 'text-foreground'}>
                                {team.code}
                              </span>
                            </div>
                          </td>
                          <td className="text-center px-2 py-2.5 text-muted-foreground font-medium">{team.group}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.played}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.won}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.drawn}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.lost}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.gf}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">{team.ga}</td>
                          <td className="text-center px-1 py-2.5 text-muted-foreground">
                            {team.gd > 0 ? `+${team.gd}` : team.gd}
                          </td>
                          <td className="text-right px-3 py-2.5 font-bold text-primary">{team.points}</td>
                        </tr>
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-primary/20" />
              <span>Clasifica directo (1° y 2°)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500/20" />
              <span>Clasifica como mejor tercero</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
