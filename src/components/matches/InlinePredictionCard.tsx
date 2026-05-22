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
    <div className="relative w-10 h-7 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
      {url && <Image src={url} alt={code} fill className="object-cover" unoptimized />}
    </div>
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
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card px-4 pt-3 pb-3 space-y-3">
      {/* Metadata */}
      <p className="text-[11px] text-muted-foreground">
        {stageLabel} · {dateLabel}
      </p>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Flag code={homeTeam.code} />
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight">{homeTeam.code}</p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[72px]">{homeTeam.name}</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-muted-foreground shrink-0">vs</span>

        <div className="flex items-center gap-2 justify-end min-w-0">
          <div className="min-w-0 text-right">
            <p className="text-sm font-bold leading-tight">{awayTeam.code}</p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[72px]">{awayTeam.name}</p>
          </div>
          <Flag code={awayTeam.code} />
        </div>
      </div>

      {/* Score controls */}
      <div className="flex items-center justify-center gap-2">
        <button type="button" onClick={() => setHome(Math.max(0, home - 1))}
          className="w-9 h-9 rounded-full border-2 text-lg font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
          −
        </button>
        <span className="text-2xl font-bold tabular-nums w-6 text-center">{home}</span>
        <button type="button" onClick={() => setHome(home + 1)}
          className="w-9 h-9 rounded-full border-2 text-lg font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
          +
        </button>

        <span className="text-lg font-bold text-muted-foreground mx-1">–</span>

        <button type="button" onClick={() => setAway(Math.max(0, away - 1))}
          className="w-9 h-9 rounded-full border-2 text-lg font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
          −
        </button>
        <span className="text-2xl font-bold tabular-nums w-6 text-center">{away}</span>
        <button type="button" onClick={() => setAway(away + 1)}
          className="w-9 h-9 rounded-full border-2 text-lg font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
          +
        </button>
      </div>

      {/* Save */}
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
      <Button type="submit" size="sm" className="w-full" disabled={loading || saved}>
        {saved ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar pronóstico'}
      </Button>
    </form>
  )
}
