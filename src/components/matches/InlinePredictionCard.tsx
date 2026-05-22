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
  const url = getFlagUrl(code, 40)
  return (
    <div className="relative w-8 h-6 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
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
      setTimeout(() => onSaved(id), 600)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card overflow-hidden">
      {/* Match info */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] text-muted-foreground mb-2">
          {stageLabel} · {dateLabel}
        </p>
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Flag code={homeTeam.code} />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none">{homeTeam.code}</p>
              <p className="text-[10px] text-muted-foreground truncate">{homeTeam.name}</p>
            </div>
          </div>

          {/* Score inputs */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => setHome(Math.max(0, home - 1))}
              className="w-7 h-7 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              −
            </button>
            <span className="text-2xl font-bold tabular-nums w-6 text-center">{home}</span>
            <button type="button" onClick={() => setHome(home + 1)}
              className="w-7 h-7 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              +
            </button>
            <span className="text-lg font-bold text-muted-foreground mx-0.5">–</span>
            <button type="button" onClick={() => setAway(Math.max(0, away - 1))}
              className="w-7 h-7 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              −
            </button>
            <span className="text-2xl font-bold tabular-nums w-6 text-center">{away}</span>
            <button type="button" onClick={() => setAway(away + 1)}
              className="w-7 h-7 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              +
            </button>
          </div>

          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className="text-sm font-bold leading-none">{awayTeam.code}</p>
              <p className="text-[10px] text-muted-foreground truncate">{awayTeam.name}</p>
            </div>
            <Flag code={awayTeam.code} />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="px-4 pb-3 pt-1">
        {error && <p className="text-xs text-destructive text-center mb-1">{error}</p>}
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={loading || saved}
        >
          {saved ? '✓ Guardado' : loading ? 'Guardando...' : 'Guardar pronóstico'}
        </Button>
      </div>
    </form>
  )
}
