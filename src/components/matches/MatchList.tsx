'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MatchCard } from './MatchCard'
import { InlinePredictionCard } from './InlinePredictionCard'
import { AdBanner } from '@/components/shared/AdBanner'

type Match = {
  id: string
  homeTeam: { name: string; code: string; flagUrl?: string | null }
  awayTeam: { name: string; code: string; flagUrl?: string | null }
  kickoff: string
  lockAt: string
  stage: string
  group?: string | null
  status: string
  homeScore: number | null
  awayScore: number | null
  matchday: number | null
  isLocked: boolean
  myPrediction: {
    homeScore: number
    awayScore: number
    points: number | null
    category: string | null
  } | null
}

type MatchListProps = {
  matches: Match[]
  activeMatchday: number | null
  timezone: string
  pendingOnly?: boolean
}

type Section = {
  key: string
  label: string
  sublabel?: string
  matches: Match[]
  isActive: boolean
}

const KNOCKOUT_ORDER = ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL']
const KNOCKOUT_LABELS: Record<string, string> = {
  R32: 'Dieciseisavos de Final',
  R16: 'Octavos de Final',
  QF: 'Cuartos de Final',
  SF: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
}

function buildSections(matches: Match[], activeMatchday: number | null): Section[] {
  const sections: Section[] = []

  // Group stage sections by matchday
  const groupMatches = matches.filter((m) => m.stage === 'GROUP')
  const matchdayMap = new Map<number, Match[]>()
  for (const m of groupMatches) {
    const day = m.matchday ?? 0
    if (!matchdayMap.has(day)) matchdayMap.set(day, [])
    matchdayMap.get(day)!.push(m)
  }
  const sortedMatchdays = Array.from(matchdayMap.keys()).sort((a, b) => a - b)
  for (const day of sortedMatchdays) {
    const ms = matchdayMap.get(day)!
    const allFinished = ms.every((m) => m.status === 'FINISHED')
    const hasLive = ms.some((m) => m.status === 'LIVE')
    sections.push({
      key: `group-${day}`,
      label: `Fase de Grupos · Fecha ${day}`,
      sublabel: hasLive ? 'En juego' : allFinished ? 'Finalizada' : undefined,
      matches: ms,
      isActive: day === activeMatchday,
    })
  }

  // Knockout sections by stage
  for (const stage of KNOCKOUT_ORDER) {
    const ms = matches.filter((m) => m.stage === stage)
    if (ms.length === 0) continue
    const allFinished = ms.every((m) => m.status === 'FINISHED')
    const hasLive = ms.some((m) => m.status === 'LIVE')
    const hasUpcoming = ms.some((m) => m.status === 'SCHEDULED')
    sections.push({
      key: stage,
      label: KNOCKOUT_LABELS[stage],
      sublabel: hasLive ? 'En juego' : allFinished ? 'Finalizada' : hasUpcoming ? undefined : undefined,
      matches: ms,
      isActive: activeMatchday === null && hasUpcoming,
    })
  }

  return sections
}

function MatchSection({
  section,
  activeMatchday,
  timezone,
  defaultOpen,
}: {
  section: Section
  activeMatchday: number | null
  timezone: string
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  const predicted = section.matches.filter((m) => m.myPrediction).length
  const total = section.matches.length
  const allFinished = section.matches.every((m) => m.status === 'FINISHED')
  const hasLive = section.matches.some((m) => m.status === 'LIVE')

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-left min-w-0">
            <p className="font-semibold text-sm leading-tight">{section.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasLive ? (
                <span className="text-green-400 font-medium">● En juego</span>
              ) : allFinished ? (
                <span>Finalizada · {predicted}/{total} pronosticados</span>
              ) : (
                <span>{predicted}/{total} pronosticados</span>
              )}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border/40 p-3 space-y-3 bg-background/50">
          {section.matches.map((match) => (
            <MatchCard key={match.id} {...match} activeMatchday={activeMatchday} timezone={timezone} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MatchList({ matches, activeMatchday, timezone, pendingOnly = false }: MatchListProps) {
  const sections = buildSections(matches, activeMatchday)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  if (sections.length === 0) {
    return (
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No hay partidos disponibles todavía.
      </div>
    )
  }

  if (pendingOnly) {
    const activeSection = sections.find((s) => s.isActive)
    const unpredicted = (activeSection
      ? activeSection.matches.filter((m) => !m.myPrediction && !m.isLocked && m.status !== 'FINISHED' && m.status !== 'CANCELLED')
      : []
    ).filter((m) => !savedIds.has(m.id))

    const handleSaved = (id: string) => setSavedIds((prev: Set<string>) => new Set([...prev, id]))

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500/70 mb-0.5">
              {activeSection?.label ?? 'Jornada activa'}
            </p>
            <p className="text-base font-bold text-amber-500">
              {unpredicted.length === 0
                ? 'Todo predicho'
                : `${unpredicted.length} ${unpredicted.length === 1 ? 'partido sin predecir' : 'partidos sin predecir'}`}
            </p>
          </div>
          <a href="/matches" className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0 mt-1">
            Ver todos →
          </a>
        </div>
        {unpredicted.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-muted-foreground text-sm">
            Ya predijiste todos los partidos de esta jornada 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {unpredicted.map((m) => (
              <InlinePredictionCard
                key={m.id}
                id={m.id}
                homeTeam={m.homeTeam}
                awayTeam={m.awayTeam}
                kickoff={m.kickoff}
                stage={m.stage}
                group={m.group}
                timezone={timezone}
                onSaved={handleSaved}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <>
          <MatchSection
            key={section.key}
            section={section}
            activeMatchday={activeMatchday}
            timezone={timezone}
            defaultOpen={section.isActive}
          />
          {(i === 2 || i === 5) && <AdBanner key={`ad-${i}`} className="my-1" />}
        </>
      ))}
    </div>
  )
}
