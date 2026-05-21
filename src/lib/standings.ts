import { db } from './db'

export type TeamStanding = {
  teamId: string
  teamCode: string
  teamName: string
  group: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
  position: number
}

export async function calculateGroupStandings(): Promise<Map<string, TeamStanding[]>> {
  const [teams, matches] = await Promise.all([
    db.team.findMany({ where: { group: { not: null } } }),
    db.match.findMany({
      where: { stage: 'GROUP' },
      include: { homeTeam: true, awayTeam: true },
    }),
  ])

  const statsMap = new Map<string, TeamStanding>()
  for (const team of teams) {
    if (!team.group) continue
    statsMap.set(team.id, {
      teamId: team.id,
      teamCode: team.code,
      teamName: team.name,
      group: team.group,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0, position: 0,
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
    } else if (match.awayScore > match.homeScore) {
      away.won++; away.points += 3; home.lost++
    } else {
      home.drawn++; home.points++; away.drawn++; away.points++
    }
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga
  }

  const groupMap = new Map<string, TeamStanding[]>()
  for (const team of teams) {
    if (!team.group) continue
    if (!groupMap.has(team.group)) groupMap.set(team.group, [])
    groupMap.get(team.group)!.push(statsMap.get(team.id)!)
  }

  const result = new Map<string, TeamStanding[]>()
  for (const [group, grpTeams] of groupMap) {
    const sorted = grpTeams
      .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.teamName.localeCompare(b.teamName))
      .map((t, i) => ({ ...t, position: i + 1 }))
    result.set(group, sorted)
  }

  return result
}

export function getBestThirds(standings: Map<string, TeamStanding[]>): TeamStanding[] {
  const thirds: TeamStanding[] = []
  for (const grpTeams of standings.values()) {
    if (grpTeams[2]) thirds.push(grpTeams[2])
  }
  return thirds
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf)
    .slice(0, 8)
}
