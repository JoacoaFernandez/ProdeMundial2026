import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { mapRoundToStage, mapStatusToMatchStatus } from '@/lib/football-api'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const filePath = join(process.cwd(), 'matches.json')
  let raw: { matches: any[] }
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return NextResponse.json({ error: 'matches.json no encontrado' }, { status: 404 })
  }

  let imported = 0
  let skipped = 0

  const codeMap: Record<string, string> = { URY: 'URU', RSA: 'ZAF' }

  for (const m of raw.matches) {
    const home = m.homeTeam
    const away = m.awayTeam

    if (!home?.id || !away?.id) { skipped++; continue }

    const groupStr = m.group ? m.group.replace('GROUP_', '') : null

    const resolveTeam = async (t: { id: number; name: string; tla?: string }) => {
      const rawCode = t.tla ?? null
      const code = rawCode ? (codeMap[rawCode] || rawCode) : null

      let team = await db.team.findUnique({ where: { externalId: String(t.id) } })

      if (team && code && team.code !== code) {
        await db.team.update({
          where: { id: team.id },
          data: { externalId: `old-${team.externalId}-${team.code}` },
        })
        team = null
      }

      if (team && groupStr && team.group !== groupStr) {
        team = await db.team.update({ where: { id: team.id }, data: { group: groupStr } })
      }

      if (!team && code) {
        team = await db.team.findUnique({ where: { code } })
        if (team) {
          await db.team.update({ where: { id: team.id }, data: { externalId: String(t.id), ...(groupStr ? { group: groupStr } : {}) } })
        } else {
          team = await db.team.create({
            data: { externalId: String(t.id), name: t.name, code, group: groupStr },
          })
        }
      }
      return team
    }

    const homeTeam = await resolveTeam(home)
    const awayTeam = await resolveTeam(away)

    if (!homeTeam || !awayTeam) { skipped++; continue }

    const kickoff = new Date(m.utcDate)
    const lockAt = new Date(kickoff.getTime() - 10 * 60 * 1000)
    const short = (() => {
      switch (m.status) {
        case 'IN_PLAY': case 'PAUSED': return 'LIVE'
        case 'FINISHED': return 'FT'
        case 'POSTPONED': return 'PST'
        case 'CANCELLED': return 'CANC'
        default: return 'NS'
      }
    })()
    const status = mapStatusToMatchStatus(short)
    const stage = mapRoundToStage(m.stage)

    await db.match.upsert({
      where: { externalId: String(m.id) },
      update: {
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
        status,
        kickoff,
        lockAt,
        stage,
      },
      create: {
        externalId: String(m.id),
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        kickoff,
        lockAt,
        stage,
        status,
        homeScore: m.score?.fullTime?.home ?? null,
        awayScore: m.score?.fullTime?.away ?? null,
      },
    })

    imported++
  }

  return NextResponse.json({ ok: true, imported, skipped })
}
