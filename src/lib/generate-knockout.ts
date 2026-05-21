import { db } from './db'
import { calculateGroupStandings, getBestThirds, type TeamStanding } from './standings'
import { R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL_THIRD_BRACKET, slotToLabel, type AdvancementTemplate } from './bracket'
import type { Stage } from '@/generated/prisma/enums'

type TeamRef = { teamId: string; label: string }

function resolveGroupSlot(slot: string, standings: Map<string, TeamStanding[]>, bestThirds: TeamStanding[]): TeamRef | null {
  if (slot.startsWith('W_')) {
    const group = slot.slice(2)
    const t = standings.get(group)?.[0]
    return t ? { teamId: t.teamId, label: `1° Grupo ${group}` } : null
  }
  if (slot.startsWith('RU_')) {
    const group = slot.slice(3)
    const t = standings.get(group)?.[1]
    return t ? { teamId: t.teamId, label: `2° Grupo ${group}` } : null
  }
  if (slot.startsWith('T3_')) {
    const idx = parseInt(slot.slice(3)) - 1
    const t = bestThirds[idx]
    return t ? { teamId: t.teamId, label: `3° Grupo ${t.group}` } : null
  }
  return null
}

async function getMatchResult(bracketSlot: string, getLoser = false): Promise<TeamRef | null> {
  const match = await db.match.findFirst({
    where: { bracketSlot },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })
  if (!match || match.status !== 'FINISHED') return null
  if (match.homeScore === null || match.awayScore === null) return null

  let winnerId: string
  let winnerName: string

  if (match.knockoutWinnerId) {
    const isHome = match.knockoutWinnerId === match.homeTeamId
    const loserId = isHome ? match.awayTeamId : match.homeTeamId
    const loserName = isHome ? match.awayTeam.name : match.homeTeam.name
    if (getLoser) {
      return { teamId: loserId, label: loserName }
    }
    return { teamId: match.knockoutWinnerId, label: isHome ? match.homeTeam.name : match.awayTeam.name }
  }

  if (match.homeScore === match.awayScore) return null // AET/PEN needs knockoutWinnerId

  const homeWon = match.homeScore > match.awayScore
  if (getLoser) {
    winnerId = homeWon ? match.awayTeamId : match.homeTeamId
    winnerName = homeWon ? match.awayTeam.name : match.homeTeam.name
  } else {
    winnerId = homeWon ? match.homeTeamId : match.awayTeamId
    winnerName = homeWon ? match.homeTeam.name : match.awayTeam.name
  }

  return { teamId: winnerId, label: winnerName }
}

async function createMatchFromTemplate(
  slot: string,
  stage: Stage,
  home: TeamRef,
  away: TeamRef,
  kickoff: Date,
) {
  const existing = await db.match.findFirst({ where: { bracketSlot: slot } })
  if (existing) return null

  return db.match.create({
    data: {
      externalId: `auto_${slot}`,
      homeTeamId: home.teamId,
      awayTeamId: away.teamId,
      kickoff,
      lockAt: new Date(kickoff.getTime() - 60 * 60 * 1000),
      stage,
      status: 'SCHEDULED',
      bracketSlot: slot,
      homeSlotLabel: home.label,
      awaySlotLabel: away.label,
    },
  })
}

export async function generateR32(): Promise<{ created: number; skipped: number; errors: string[] }> {
  const standings = await calculateGroupStandings()
  const bestThirds = getBestThirds(standings)

  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const tmpl of R32_BRACKET) {
    const existing = await db.match.findFirst({ where: { bracketSlot: tmpl.slot } })
    if (existing) { skipped++; continue }

    const home = resolveGroupSlot(tmpl.homeSlot, standings, bestThirds)
    const away = resolveGroupSlot(tmpl.awaySlot, standings, bestThirds)

    if (!home || !away) {
      errors.push(`No se pudo resolver ${tmpl.slot}: ${tmpl.homeSlot}=${!!home}, ${tmpl.awaySlot}=${!!away}`)
      continue
    }

    await createMatchFromTemplate(tmpl.slot, 'R32', home, away, tmpl.kickoff)
    created++
  }

  return { created, skipped, errors }
}

async function generateRound(templates: AdvancementTemplate[]): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0
  let skipped = 0
  const errors: string[] = []

  for (const tmpl of templates) {
    const existing = await db.match.findFirst({ where: { bracketSlot: tmpl.slot } })
    if (existing) { skipped++; continue }

    const home = await getMatchResult(tmpl.homeFromSlot, tmpl.homeIsLoser ?? false)
    const away = await getMatchResult(tmpl.awayFromSlot, tmpl.awayIsLoser ?? false)

    if (!home || !away) {
      errors.push(`No se pudo resolver ${tmpl.slot}: home=${!!home}, away=${!!away}`)
      continue
    }

    await createMatchFromTemplate(tmpl.slot, tmpl.stage, home, away, tmpl.kickoff)
    created++
  }

  return { created, skipped, errors }
}

export const generateR16 = () => generateRound(R16_BRACKET)
export const generateQF = () => generateRound(QF_BRACKET)
export const generateSF = () => generateRound(SF_BRACKET)
export const generateFinalAndThird = () => generateRound(FINAL_THIRD_BRACKET)

// Check if all matches of a given stage are finished
export async function isRoundComplete(stage: Stage): Promise<boolean> {
  const total = await db.match.count({ where: { stage } })
  const finished = await db.match.count({ where: { stage, status: 'FINISHED' } })
  return total > 0 && total === finished
}

// Check if group stage is complete (all matchdays played)
export async function isGroupStageComplete(): Promise<boolean> {
  const total = await db.match.count({ where: { stage: 'GROUP' } })
  const finished = await db.match.count({ where: { stage: 'GROUP', status: 'FINISHED' } })
  return total > 0 && total === finished
}
