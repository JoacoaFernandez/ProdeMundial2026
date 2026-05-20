'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  homeTeam: string
  awayTeam: string
  kickoff: string
  status: string
  homeScore: number | null
  awayScore: number | null
  predictionCount: number
  scoredAt: string | null
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'text-blue-600',
  LIVE: 'text-green-600',
  FINISHED: 'text-gray-500',
  CANCELLED: 'text-red-500',
  POSTPONED: 'text-yellow-600',
}

export function AdminMatchRow({ id, homeTeam, awayTeam, kickoff, status, homeScore, awayScore, predictionCount, scoredAt }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [home, setHome] = useState(String(homeScore ?? ''))
  const [away, setAway] = useState(String(awayScore ?? ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function saveResult() {
    const h = parseInt(home, 10)
    const a = parseInt(away, 10)
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setError('Valores inválidos')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch(`/api/admin/matches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ homeScore: h, awayScore: a, status: 'FINISHED' }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Error al guardar')
      return
    }

    setEditing(false)
    router.refresh()
  }

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-4 py-3 font-medium">
        {homeTeam} – {awayTeam}
      </td>
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
        {new Date(kickoff).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="px-4 py-3">
        <span className={`font-medium text-xs ${STATUS_COLORS[status] ?? ''}`}>{status}</span>
        {scoredAt && <span className="ml-1 text-xs text-muted-foreground">✓</span>}
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{predictionCount}</td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex items-center gap-1 justify-end">
            <Input
              type="number"
              min={0}
              max={99}
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="w-14 h-7 text-center px-1"
            />
            <span>–</span>
            <Input
              type="number"
              min={0}
              max={99}
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="w-14 h-7 text-center px-1"
            />
            <Button size="sm" onClick={saveResult} disabled={loading} className="h-7 px-2 text-xs">
              {loading ? '...' : 'OK'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 px-2 text-xs">
              ✕
            </Button>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-mono hover:underline"
          >
            {homeScore !== null ? `${homeScore} – ${awayScore}` : '— · —'}
          </button>
        )}
      </td>
    </tr>
  )
}
