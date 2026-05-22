'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getFlagUrl } from '@/lib/team-flags'
import { Button } from '@/components/ui/button'

type Props = {
  id: string
  homeTeam: { name: string; code: string }
  awayTeam: { name: string; code: string }
  kickoff: string
  stage: string
  group?: string | null
  timezone: string
  onSaved: (id: string) => void
}

const STAGE_LABELS: Record<string, string> = {
  GROUP: 'Fase de grupos',
  R32: 'Ronda de 32',
  R16: 'Octavos de final',
  QF: 'Cuartos de final',
  SF: 'Semifinal',
  THIRD: 'Tercer puesto',
  FINAL: 'Final',
}

function Flag({ code }: { code: string }) {
  const url = getFlagUrl(code, 80)
  return (
    <div className="relative w-12 h-8 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
      {url && <Image src={url} alt={code} fill className="object-cover" unoptimized />}
    </div>
  )
}

function ScoreBtn({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-full border-2 border-border text-lg font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors shrink-0"
    >
      {children}
    </button>
  )
}

export function InlinePredictionCard({ id, homeTeam, awayTeam, kickoff, stage, group, timezone, onSaved }: Props) {
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const kickoffDate = new Date(kickoff)
  const dateLabel = kickoffDate.toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: timezone,
  })
  const stageLabel = stage === 'GROUP'
    ? group ? `Grupo ${group}` : 'Fase de grupos'
    : (STAGE_LABELS[stage] ?? stage)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: id, homeScore: home, awayScore: away }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        return
      }
      setSaved(true)
      setTimeout(() => onSaved(id), 700)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card overflow-hidden">
      {/* Date + stage */}
      <div className="px-4 pt-3 pb-0">
        <p className="text-[11px] text-muted-foreground">
          {stageLabel} · {dateLabel}
        </p>
      </div>

      {/* Teams row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <Flag code={homeTeam.code} />
          <p className="text-sm font-bold">{homeTeam.code}</p>
          <p className="text-[10px] text-muted-foreground text-center leading-tight">{homeTeam.name}</p>
        </div>

        {/* Score controls */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ScoreBtn onClick={() => setHome(Math.max(0, home - 1))}>−</ScoreBtn>
            <span className="text-3xl font-bold tabular-nums w-7 text-center">{home}</span>
            <ScoreBtn onClick={() => setHome(home + 1)}>+</ScoreBtn>
            <span className="text-xl font-bold text-muted-foreground px-0.5">–</span>
            <ScoreBtn onClick={() => setAway(Math.max(0, away - 1))}>−</ScoreBtn>
            <span className="text-3xl font-bold tabular-nums w-7 text-center">{away}</span>
            <ScoreBtn onClick={() => setAway(away + 1)}>+</ScoreBtn>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <Flag code={awayTeam.code} />
          <p className="text-sm font-bold">{awayTeam.code}</p>
          <p className="text-[10px] text-muted-foreground text-center leading-tight">{awayTeam.name}</p>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pb-3 pt-1 space-y-1">
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        <Button type="submit" size="sm" className="w-full" disabled={loading || saved}>
          {saved ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar pronóstico'}
        </Button>
      </div>
    </form>
  )
}
