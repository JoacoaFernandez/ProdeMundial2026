import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { getFlagUrl } from '@/lib/team-flags'
import {
  R32_BRACKET, R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL_THIRD_BRACKET, slotToLabel,
} from '@/lib/bracket'

// ─── slot → default placeholder labels ───────────────────────────────────────

function getSlotLabels(slot: string): { home: string; away: string } {
  const r32 = R32_BRACKET.find(t => t.slot === slot)
  if (r32) return { home: slotToLabel(r32.homeSlot), away: slotToLabel(r32.awaySlot) }

  const r16 = R16_BRACKET.find(t => t.slot === slot)
  if (r16) return { home: `Gan. ${r16.homeFromSlot}`, away: `Gan. ${r16.awayFromSlot}` }

  const qf = QF_BRACKET.find(t => t.slot === slot)
  if (qf) return { home: `Gan. ${qf.homeFromSlot}`, away: `Gan. ${qf.awayFromSlot}` }

  const sf = SF_BRACKET.find(t => t.slot === slot)
  if (sf) return { home: `Gan. ${sf.homeFromSlot}`, away: `Gan. ${sf.awayFromSlot}` }

  if (slot === 'FINAL') return { home: 'Gan. SF_1', away: 'Gan. SF_2' }
  if (slot === 'THIRD') return { home: 'Per. SF_1', away: 'Per. SF_2' }

  return { home: '?', away: '?' }
}

// ─── types ────────────────────────────────────────────────────────────────────

type DbMatch = Awaited<ReturnType<typeof fetchMatches>>[number]

async function fetchMatches() {
  return db.match.findMany({
    where: { stage: { in: ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] } },
    select: {
      id: true,
      bracketSlot: true,
      homeScore: true,
      awayScore: true,
      homeSlotLabel: true,
      awaySlotLabel: true,
      status: true,
      knockoutWinnerId: true,
      homeTeam: { select: { id: true, name: true, code: true } },
      awayTeam: { select: { id: true, name: true, code: true } },
    },
  })
}

// ─── match card ───────────────────────────────────────────────────────────────

function MatchCard({ slot, match }: { slot: string; match?: DbMatch }) {
  const labels = match
    ? { home: match.homeTeam?.name ?? match.homeSlotLabel ?? '?', away: match.awayTeam?.name ?? match.awaySlotLabel ?? '?' }
    : getSlotLabels(slot)

  const homeFlagUrl = match?.homeTeam ? getFlagUrl(match.homeTeam.code, 40) : null
  const awayFlagUrl = match?.awayTeam ? getFlagUrl(match.awayTeam.code, 40) : null

  let homeWon = false
  let awayWon = false
  if (match?.status === 'FINISHED') {
    if (match.knockoutWinnerId) {
      homeWon = match.knockoutWinnerId === match.homeTeam?.id
      awayWon = match.knockoutWinnerId === match.awayTeam?.id
    } else if (match.homeScore !== null && match.awayScore !== null) {
      homeWon = match.homeScore > match.awayScore
      awayWon = match.awayScore > match.homeScore
    }
  }

  const tbd = !match
  const statusDot = match?.status === 'FINISHED'
    ? 'bg-green-500'
    : match?.status === 'LIVE'
      ? 'bg-red-500 animate-pulse'
      : null

  return (
    <div className={`border rounded-lg bg-card overflow-hidden shadow-sm w-44 text-xs ${tbd ? 'opacity-40' : ''}`}>
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${homeWon ? 'bg-primary/10' : ''}`}>
        {homeFlagUrl
          ? <div className="relative w-4 h-3 rounded-[2px] overflow-hidden border border-black/10 shrink-0"><Image src={homeFlagUrl} alt="" fill className="object-cover" unoptimized /></div>
          : <div className="w-4 h-3 rounded-[2px] bg-muted/60 shrink-0" />}
        <span className={`flex-1 truncate ${homeWon ? 'font-bold text-primary' : 'text-foreground'}`}>{labels.home}</span>
        {match?.homeScore !== null && match?.homeScore !== undefined &&
          <span className={`font-bold tabular-nums w-4 text-right ${homeWon ? 'text-primary' : 'text-muted-foreground'}`}>{match.homeScore}</span>}
      </div>
      <div className="border-t relative">
        {statusDot && <span className={`absolute right-2 -top-1.5 w-2 h-2 rounded-full ${statusDot}`} />}
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-1.5 ${awayWon ? 'bg-primary/10' : ''}`}>
        {awayFlagUrl
          ? <div className="relative w-4 h-3 rounded-[2px] overflow-hidden border border-black/10 shrink-0"><Image src={awayFlagUrl} alt="" fill className="object-cover" unoptimized /></div>
          : <div className="w-4 h-3 rounded-[2px] bg-muted/60 shrink-0" />}
        <span className={`flex-1 truncate ${awayWon ? 'font-bold text-primary' : 'text-foreground'}`}>{labels.away}</span>
        {match?.awayScore !== null && match?.awayScore !== undefined &&
          <span className={`font-bold tabular-nums w-4 text-right ${awayWon ? 'text-primary' : 'text-muted-foreground'}`}>{match.awayScore}</span>}
      </div>
    </div>
  )
}

// ─── bracket column ───────────────────────────────────────────────────────────
// Uses flex to space matches evenly — each slot gets equal height, match card
// is centered within it, so every round naturally aligns with its pair below.

function BracketColumn({
  label, slots, matchBySlot,
}: {
  label: string
  slots: string[]
  matchBySlot: Map<string, DbMatch>
}) {
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">{label}</span>
      <div className="flex flex-col h-[512px] w-44">
        {slots.map(slot => (
          <div key={slot} className="flex-1 flex items-center justify-center">
            <MatchCard slot={slot} match={matchBySlot.get(slot)} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function BracketPage() {
  const matches = await fetchMatches()
  const matchBySlot = new Map(
    matches.filter(m => m.bracketSlot).map(m => [m.bracketSlot!, m])
  )

  const hasAnyMatches = matches.length > 0

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Llaves</h1>
          <p className="text-sm text-muted-foreground">Fase eliminatoria — bracket completo</p>
        </div>
        <Link
          href="/grupos"
          className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 pt-1"
        >
          ← Grupos
        </Link>
      </div>

      {!hasAnyMatches && (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          El bracket se habilitará cuando finalice la fase de grupos.
        </div>
      )}

      {/* Scrollable bracket */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-2 min-w-max px-2">

          {/* Left side: R32 → R16 → QF → SF */}
          <BracketColumn label="Octavos de final" slots={['R32_1','R32_2','R32_3','R32_4','R32_5','R32_6','R32_7','R32_8']} matchBySlot={matchBySlot} />
          <BracketColumn label="Cuartos" slots={['R16_1','R16_2','R16_3','R16_4']} matchBySlot={matchBySlot} />
          <BracketColumn label="Semifinal" slots={['QF_1','QF_2']} matchBySlot={matchBySlot} />
          <BracketColumn label="Final 4" slots={['SF_1']} matchBySlot={matchBySlot} />

          {/* Center: Final + 3rd place */}
          <div className="flex flex-col items-center shrink-0 w-48">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">Final</span>
            <div className="h-[512px] flex flex-col justify-center items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <MatchCard slot="FINAL" match={matchBySlot.get('FINAL')} />
                {matchBySlot.get('FINAL')?.status === 'FINISHED' && (() => {
                  const m = matchBySlot.get('FINAL')!
                  let champId: string | null = null
                  if (m.knockoutWinnerId) champId = m.knockoutWinnerId
                  else if (m.homeScore !== null && m.awayScore !== null) {
                    champId = m.homeScore > m.awayScore ? m.homeTeam?.id ?? null : m.awayTeam?.id ?? null
                  }
                  const champ = champId === m.homeTeam?.id ? m.homeTeam : m.awayTeam
                  if (!champ) return null
                  const flagUrl = getFlagUrl(champ.code, 32)
                  return (
                    <div className="flex flex-col items-center gap-1 text-yellow-500">
                      {flagUrl && (
                        <div className="relative w-8 h-5 rounded-sm overflow-hidden border border-yellow-500/30">
                          <Image src={flagUrl} alt={champ.code} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <span className="text-xs font-bold">🏆 {champ.name}</span>
                    </div>
                  )
                })()}
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">3er Puesto</span>
                <MatchCard slot="THIRD" match={matchBySlot.get('THIRD')} />
              </div>
            </div>
          </div>

          {/* Right side: SF → QF → R16 → R32 (mirrored) */}
          <BracketColumn label="Final 4" slots={['SF_2']} matchBySlot={matchBySlot} />
          <BracketColumn label="Semifinal" slots={['QF_3','QF_4']} matchBySlot={matchBySlot} />
          <BracketColumn label="Cuartos" slots={['R16_5','R16_6','R16_7','R16_8']} matchBySlot={matchBySlot} />
          <BracketColumn label="Octavos de final" slots={['R32_9','R32_10','R32_11','R32_12','R32_13','R32_14','R32_15','R32_16']} matchBySlot={matchBySlot} />

        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Deslizá para ver el bracket completo →</p>
    </div>
  )
}
