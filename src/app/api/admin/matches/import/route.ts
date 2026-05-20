import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fetchFixturesByLeague, mapRoundToStage, mapStatusToMatchStatus } from '@/lib/football-api'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const leagueId = process.env.FIFA_WORLD_CUP_LEAGUE_ID ?? '1'
  const season = 2026

  const fixtures = await fetchFixturesByLeague(leagueId, season)

  let imported = 0
  let skipped = 0

  for (const f of fixtures) {
    const homeTeam = await db.team.findUnique({ where: { externalId: String(f.teams.home.id) } })
    const awayTeam = await db.team.findUnique({ where: { externalId: String(f.teams.away.id) } })

    if (!homeTeam || !awayTeam) {
      skipped++
      continue
    }

    const kickoff = new Date(f.fixture.date)
    const lockAt = new Date(kickoff.getTime() - 10 * 60 * 1000)
    const stage = mapRoundToStage(f.league.round)
    const status = mapStatusToMatchStatus(f.fixture.status.short)

    await db.match.upsert({
      where: { externalId: String(f.fixture.id) },
      update: {
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status,
      },
      create: {
        externalId: String(f.fixture.id),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoff,
        lockAt,
        stage,
        status,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        venue: f.fixture.venue.name ?? undefined,
      },
    })

    imported++
  }

  return NextResponse.json({ ok: true, imported, skipped })
}
