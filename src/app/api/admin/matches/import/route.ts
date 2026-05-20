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
    // Función para encontrar el equipo, actualizar su externalId o crearlo si no existe (autonomía total)
    const findTeam = async (t: { id: number; name: string; code?: string }, groupStr?: string | null) => {
      const codeMap: Record<string, string> = { 'URY': 'URU', 'RSA': 'ZAF' }
      const expectedCode = t.code ? (codeMap[t.code] || t.code) : null

      let team = await db.team.findUnique({ where: { externalId: String(t.id) } })

      // Si encontramos un equipo por ID pero el código no coincide, es una colisión con la API vieja.
      if (team && expectedCode && team.code !== expectedCode) {
        await db.team.update({
          where: { id: team.id },
          data: { externalId: `old-${team.externalId}-${team.code}` }
        })
        team = null
      }

      if (!team && expectedCode) {
        team = await db.team.findUnique({ where: { code: expectedCode } })
        if (team) {
          await db.team.update({ where: { id: team.id }, data: { externalId: String(t.id) } })
        } else {
          // El equipo no existe en la base de datos, lo creamos automáticamente
          team = await db.team.create({
            data: {
              externalId: String(t.id),
              name: t.name,
              code: expectedCode,
              group: groupStr || null
            }
          })
        }
      }
      return team
    }

    const homeTeam = await findTeam(f.teams.home, f.league.group)
    const awayTeam = await findTeam(f.teams.away, f.league.group)

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
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: f.goals.home,
        awayScore: f.goals.away,
        status,
        kickoff,
        lockAt,
        stage,
        venue: f.fixture.venue.name ?? undefined,
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
