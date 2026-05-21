'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Member = { userId: string; name: string }

type MatchPrediction = {
  userId: string
  homeScore: number
  awayScore: number
  points: number | null
  category: string | null
}

type MatchRow = {
  id: string
  matchday: number
  kickoff: string
  homeTeam: { name: string; code: string }
  awayTeam: { name: string; code: string }
  homeScore: number | null
  awayScore: number | null
  status: string
  predictions: MatchPrediction[]
}

type Props = {
  matches: MatchRow[]
  members: Member[]
  myUserId: string
}

const CATEGORY_COLOR: Record<string, string> = {
  EXACT: 'text-green-500',
  WINNER_DIFF: 'text-blue-500',
  WINNER_ONLY: 'text-yellow-500',
  WRONG: 'text-red-400',
}

export function MatchdayPredictions({ matches, members, myUserId }: Props) {
  const matchdays = Array.from(new Set(matches.map((m) => m.matchday))).sort((a, b) => a - b)
  const [selected, setSelected] = useState(matchdays[0] ?? 1)

  const dayMatches = matches.filter((m) => m.matchday === selected)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {matchdays.map((d) => (
          <button
            key={d}
            onClick={() => setSelected(d)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              selected === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Jornada {d}
          </button>
        ))}
      </div>

      {/* Matches */}
      <div className="space-y-3">
        {dayMatches.map((match) => {
          const isFinished = match.status === 'FINISHED'
          return (
            <div key={match.id} className="rounded-lg border overflow-hidden">
              {/* Match header */}
              <Link href={`/matches/${match.id}`} className="block bg-muted/40 px-4 py-2 flex items-center justify-between hover:bg-muted/60 transition-colors">
                <span className="text-sm font-semibold">
                  {match.homeTeam.code} vs {match.awayTeam.code}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {isFinished ? (
                    <span className="font-mono font-bold text-foreground">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  ) : (
                    <span>
                      {new Date(match.kickoff).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(match.kickoff).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </Link>

              {/* Member predictions */}
              <div className="divide-y divide-border/50">
                {members.map((member) => {
                  const pred = match.predictions.find((p) => p.userId === member.userId)
                  const catColor = pred?.category ? CATEGORY_COLOR[pred.category] : null
                  const isMe = member.userId === myUserId
                  return (
                    <div
                      key={member.userId}
                      className={cn('flex items-center justify-between px-4 py-2', isMe && 'bg-primary/5')}
                    >
                      <span className={cn('text-sm', isMe && 'font-semibold')}>
                        {member.name}{isMe ? ' (vos)' : ''}
                      </span>
                      {pred ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">
                            {pred.homeScore} – {pred.awayScore}
                          </span>
                          {pred.points !== null && (
                            <span className={cn('text-xs font-bold', catColor)}>
                              +{pred.points}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin pronóstico</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
