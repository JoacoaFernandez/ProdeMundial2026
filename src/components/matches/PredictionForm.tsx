'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type PredictionFormProps = {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  initialHome?: number
  initialAway?: number
  isLocked: boolean
  onSaved?: (home: number, away: number) => void
}

function ScoreSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground text-center leading-tight">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-10 h-10 rounded-full border-2 text-xl font-bold flex items-center justify-center transition-colors hover:bg-muted active:scale-95"
        >
          −
        </button>
        <span className="text-4xl font-bold tabular-nums w-10 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full border-2 text-xl font-bold flex items-center justify-center transition-colors hover:bg-muted active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  )
}

export function PredictionForm({
  matchId,
  homeTeamName,
  awayTeamName,
  initialHome,
  initialAway,
  isLocked,
  onSaved,
}: PredictionFormProps) {
  const [homeScore, setHomeScore] = useState(initialHome ?? 0)
  const [awayScore, setAwayScore] = useState(initialAway ?? 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function handleChange(setter: (v: number) => void) {
    return (v: number) => {
      setter(v)
      setSaved(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore, awayScore }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'No se pudo guardar el pronóstico.')
        return
      }

      setSaved(true)
      onSaved?.(homeScore, awayScore)
    } finally {
      setLoading(false)
    }
  }

  if (isLocked) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        El partido está cerrado para pronósticos.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2">
        <ScoreSelector label={homeTeamName} value={homeScore} onChange={handleChange(setHomeScore)} />
        <span className="text-2xl font-bold text-muted-foreground mb-0 mt-6">–</span>
        <ScoreSelector label={awayTeamName} value={awayScore} onChange={handleChange(setAwayScore)} />
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {saved && (
        <p className="text-sm text-green-600 text-center font-medium">Pronóstico guardado</p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Guardando...' : initialHome !== undefined ? 'Actualizar pronóstico' : 'Guardar pronóstico'}
      </Button>
    </form>
  )
}
