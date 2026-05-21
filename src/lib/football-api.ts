const BASE_URL = 'https://api.football-data.org/v4'

const headers = {
  'X-Auth-Token': process.env.RAPIDAPI_KEY ?? '',
}

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    venue: { name: string | null }
    status: { short: string }
  }
  teams: {
    home: { id: number; name: string; code?: string }
    away: { id: number; name: string; code?: string }
  }
  goals: { home: number | null; away: number | null }
  league: { round: string; group?: string | null }
  winner?: 'HOME_TEAM' | 'AWAY_TEAM' | null
}

export async function fetchFixturesByLeague(leagueId: string, season: number): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('API Key no configurada (usando variable RAPIDAPI_KEY)')

  // API-Sports usaba '1' para el Mundial. Football-Data usa '2000'
  const compId = leagueId === '1' ? '2000' : leagueId;

  const res = await fetch(`${BASE_URL}/competitions/${compId}/matches?season=${season}`, { headers })
  if (!res.ok) throw new Error(`Football-Data API error: ${res.status}`)

  const data = await res.json()
  return data.matches.map(mapFdMatchToApiFixture)
}

export async function fetchLiveFixtures(leagueId: string): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('API Key no configurada')

  const compId = leagueId === '1' ? '2000' : leagueId;
  const res = await fetch(`${BASE_URL}/competitions/${compId}/matches?status=IN_PLAY,PAUSED`, { headers })
  if (!res.ok) throw new Error(`Football-Data API error: ${res.status}`)

  const data = await res.json()
  return data.matches.map(mapFdMatchToApiFixture)
}

export async function fetchTodayFixtures(leagueId: string): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('API Key no configurada')

  const compId = leagueId === '1' ? '2000' : leagueId;
  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${BASE_URL}/competitions/${compId}/matches?dateFrom=${today}&dateTo=${today}`, { headers })
  if (!res.ok) throw new Error(`Football-Data API error: ${res.status}`)

  const data = await res.json()
  return data.matches.map(mapFdMatchToApiFixture)
}

function mapFdMatchToApiFixture(m: any): ApiFixture {
  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      venue: { name: null },
      status: { short: mapFdStatusToShort(m.status) }
    },
    teams: {
      home: { id: m.homeTeam?.id ?? 0, name: m.homeTeam?.name ?? 'TBD', code: m.homeTeam?.tla },
      away: { id: m.awayTeam?.id ?? 0, name: m.awayTeam?.name ?? 'TBD', code: m.awayTeam?.tla }
    },
    goals: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null
    },
    league: {
      round: m.stage,
      group: m.group ? m.group.replace('GROUP_', '') : null
    },
    winner: m.score?.winner ?? null,
  }
}

function mapFdStatusToShort(status: string): string {
  switch (status) {
    case 'IN_PLAY':
    case 'PAUSED': return 'LIVE'
    case 'FINISHED': return 'FT'
    case 'POSTPONED': return 'PST'
    case 'CANCELLED': return 'CANC'
    case 'SUSPENDED': return 'ABD'
    default: return 'NS'
  }
}

export function mapStatusToMatchStatus(short: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' {
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(short)) return 'LIVE'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'FINISHED'
  if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'CANCELLED'
  if (['PST'].includes(short)) return 'POSTPONED'
  return 'SCHEDULED'
}

export function mapRoundToStage(round: string): 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL' {
  const r = round?.toUpperCase() || ''
  if (r.includes('GROUP')) return 'GROUP'
  if (r.includes('LAST_32')) return 'R32'
  if (r.includes('LAST_16')) return 'R16'
  if (r.includes('QUARTER')) return 'QF'
  if (r.includes('SEMI')) return 'SF'
  if (r.includes('THIRD_PLACE')) return 'THIRD'
  if (r.includes('FINAL')) return 'FINAL'
  return 'GROUP'
}
