'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PredictionFormProps = {
  matchId: string
  homeTeamName: string
  awayTeamName: string
  initialHome?: number
  initialAway?: number
  isLocked: boolean
  onSaved?: (home: number, away: number) => void
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
  const [homeScore, setHomeScore] = useState(initialHome !== undefined ? String(initialHome) : '')
  const [awayScore, setAwayScore] = useState(initialAway !== undefined ? String(initialAway) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const home = parseInt(homeScore, 10)
    const away = parseInt(awayScore, 10)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      setError('Ingresá valores válidos (0 o más).')
      return
    }

    setLoading(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'No se pudo guardar el pronóstico.')
        return
      }

      setSaved(true)
      onSaved?.(home, away)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="home-score">{homeTeamName}</Label>
          <Input
            id="home-score"
            type="number"
            min={0}
            max={99}
            value={homeScore}
            onChange={(e) => { setHomeScore(e.target.value); setSaved(false) }}
            className="text-center text-2xl font-bold h-14"
            placeholder="0"
          />
        </div>
        <span className="text-2xl font-bold text-muted-foreground mt-6">–</span>
        <div className="flex-1 space-y-1">
          <Label htmlFor="away-score">{awayTeamName}</Label>
          <Input
            id="away-score"
            type="number"
            min={0}
            max={99}
            value={awayScore}
            onChange={(e) => { setAwayScore(e.target.value); setSaved(false) }}
            className="text-center text-2xl font-bold h-14"
            placeholder="0"
          />
        </div>
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
