const BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3'

const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY ?? '',
  'X-RapidAPI-Host': process.env.RAPIDAPI_HOST ?? 'api-football-v1.p.rapidapi.com',
}

export type ApiFixture = {
  fixture: {
    id: number
    date: string
    venue: { name: string | null }
    status: { short: string }
  }
  teams: {
    home: { id: number; name: string }
    away: { id: number; name: string }
  }
  goals: { home: number | null; away: number | null }
  league: { round: string }
}

export async function fetchFixturesByLeague(leagueId: string, season: number): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY no configurada')

  const res = await fetch(`${BASE_URL}/fixtures?league=${leagueId}&season=${season}`, { headers })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)

  const data = await res.json()
  return data.response as ApiFixture[]
}

export async function fetchLiveFixtures(leagueId: string): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY no configurada')

  const res = await fetch(`${BASE_URL}/fixtures?league=${leagueId}&live=all`, { headers })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)

  const data = await res.json()
  return data.response as ApiFixture[]
}

export async function fetchTodayFixtures(leagueId: string): Promise<ApiFixture[]> {
  if (!process.env.RAPIDAPI_KEY) throw new Error('RAPIDAPI_KEY no configurada')

  const today = new Date().toISOString().slice(0, 10)
  const res = await fetch(`${BASE_URL}/fixtures?league=${leagueId}&date=${today}`, { headers })
  if (!res.ok) throw new Error(`API-Football error: ${res.status}`)

  const data = await res.json()
  return data.response as ApiFixture[]
}

export function mapStatusToMatchStatus(short: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'POSTPONED' {
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(short)) return 'LIVE'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'FINISHED'
  if (['CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'CANCELLED'
  if (['PST'].includes(short)) return 'POSTPONED'
  return 'SCHEDULED'
}

export function mapRoundToStage(round: string): 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'THIRD' | 'FINAL' {
  const r = round.toLowerCase()
  if (r.includes('group')) return 'GROUP'
  if (r.includes('round of 64') || r.includes('round of 32')) return 'R32'
  if (r.includes('round of 16')) return 'R16'
  if (r.includes('quarter')) return 'QF'
  if (r.includes('semi')) return 'SF'
  if (r.includes('3rd') || r.includes('third')) return 'THIRD'
  if (r.includes('final')) return 'FINAL'
  return 'GROUP'
}
