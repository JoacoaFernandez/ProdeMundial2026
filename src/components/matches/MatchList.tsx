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

type Filter = (typeof FILTER_OPTIONS)[number]['value']

export function MatchList({ matches }: MatchListProps) {
  const [filter, setFilter] = useState<Filter>('upcoming')

  const filtered = matches.filter((m) => {
    if (filter === 'upcoming') return m.status === 'SCHEDULED' || m.status === 'LIVE'
    if (filter === 'finished') return m.status === 'FINISHED'
    return true
  })

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

      {filtered.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No hay partidos en esta categoría.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match) => (
            <MatchCard key={match.id} {...match} />
          ))}
        </div>
      )}
    </div>
  )
}
