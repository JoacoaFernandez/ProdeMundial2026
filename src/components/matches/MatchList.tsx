'use client'

import { useState } from 'react'
import { MatchCard } from './MatchCard'

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
}

const FILTER_OPTIONS = [
  { label: 'Próximos', value: 'upcoming' },
  { label: 'Todos', value: 'all' },
  { label: 'Finalizados', value: 'finished' },
] as const

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de grupos',
  R32: 'Ronda de 32',
  R16: 'Octavos de final',
  QF: 'Cuartos de final',
  SF: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
}

type Filter = (typeof FILTER_OPTIONS)[number]['value']

function groupByDate(matches: Match[]): [string, Match[]][] {
  const map = new Map<string, Match[]>()
  for (const m of matches) {
    const key = new Date(m.kickoff).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Argentina/Buenos_Aires',
    })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  return Array.from(map.entries())
}

export function MatchList({ matches }: MatchListProps) {
  const [filter, setFilter] = useState<Filter>('upcoming')

  const filtered = matches.filter((m) => {
    if (filter === 'upcoming') return m.status === 'SCHEDULED' || m.status === 'LIVE'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

  const grouped = groupByDate(filtered)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No hay partidos en esta categoría.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, dayMatches]) => {
            const stage = dayMatches[0].stage
            const stageLabel = stage !== 'GROUP' ? STAGE_LABELS[stage] : null
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground capitalize">{date}</span>
                    {stageLabel && (
                      <span className="text-xs text-primary font-medium uppercase tracking-wide">{stageLabel}</span>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">{dayMatches.length} partido{dayMatches.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dayMatches.map((match) => (
                    <MatchCard key={match.id} {...match} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
