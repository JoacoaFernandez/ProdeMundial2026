'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getFlagUrl } from '@/lib/team-flags'

const CATEGORY_STYLES: Record<string, { label: string; color: string; bar: string }> = {
  EXACT:       { label: 'Exacto',      color: 'text-green-500',  bar: 'bg-green-500' },
  WINNER_DIFF: { label: '+Diferencia', color: 'text-blue-500',   bar: 'bg-blue-500' },
  WINNER_ONLY: { label: 'Ganador',     color: 'text-yellow-500', bar: 'bg-yellow-500' },
  WRONG:       { label: 'Incorrecto',  color: 'text-red-400',    bar: 'bg-red-400' },
}

type Props = {
  matchId: string
  homeTeam: { code: string; name: string }
  awayTeam: { code: string; name: string }
  matchStatus: string
  matchHomeScore: number | null
  matchAwayScore: number | null
  isLocked: boolean
  predHomeScore: number
  predAwayScore: number
  points: number | null
  category: string | null
}

export function EditablePredictionRow({
  matchId,
  homeTeam,
  awayTeam,
  matchStatus,
  matchHomeScore,
  matchAwayScore,
  isLocked,
  predHomeScore,
  predAwayScore,
  points,
  category,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [home, setHome] = useState(predHomeScore)
  const [away, setAway] = useState(predAwayScore)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  const isFinished = matchStatus === 'FINISHED'
  const canEdit = !isLocked && !isFinished
  const cat = category ? CATEGORY_STYLES[category] : null
  const homeFlag = getFlagUrl(homeTeam.code, 80)
  const awayFlag = getFlagUrl(awayTeam.code, 80)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
      })
      if (!res.ok) return
      setSaved(true)
      setEditing(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 space-y-3">
          {/* Teams */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                {homeFlag && <Image src={homeFlag} alt={homeTeam.name} fill className="object-cover" unoptimized />}
              </div>
              <span className="text-xs font-bold">{homeTeam.code}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">vs</span>
            <div className="flex items-center gap-2 justify-end min-w-0">
              <span className="text-xs font-bold">{awayTeam.code}</span>
              <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
                {awayFlag && <Image src={awayFlag} alt={awayTeam.name} fill className="object-cover" unoptimized />}
              </div>
            </div>
          </div>

          {/* Score controls */}
          <div className="flex items-center justify-center gap-2">
            <button type="button" onClick={() => setHome(Math.max(0, home - 1))}
              className="w-8 h-8 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              −
            </button>
            <span className="text-xl font-bold tabular-nums w-5 text-center">{home}</span>
            <button type="button" onClick={() => setHome(home + 1)}
              className="w-8 h-8 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              +
            </button>
            <span className="text-base font-bold text-muted-foreground mx-1">–</span>
            <button type="button" onClick={() => setAway(Math.max(0, away - 1))}
              className="w-8 h-8 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              −
            </button>
            <span className="text-xl font-bold tabular-nums w-5 text-center">{away}</span>
            <button type="button" onClick={() => setAway(away + 1)}
              className="w-8 h-8 rounded-full border-2 text-base font-bold flex items-center justify-center hover:bg-muted active:scale-95 transition-colors">
              +
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setHome(predHomeScore); setAway(predAwayScore) }}
              className="flex-1 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const inner = (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {cat && <div className={cn('h-0.5', cat.bar)} />}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Teams */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
            {homeFlag && <Image src={homeFlag} alt={homeTeam.name} fill className="object-cover" unoptimized />}
          </div>
          <span className="text-xs font-bold shrink-0">{homeTeam.code}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">vs</span>
          <span className="text-xs font-bold shrink-0">{awayTeam.code}</span>
          <div className="relative w-7 h-5 rounded overflow-hidden border border-black/10 bg-muted shrink-0">
            {awayFlag && <Image src={awayFlag} alt={awayTeam.name} fill className="object-cover" unoptimized />}
          </div>
        </div>

        {/* Result vs prediction */}
        <div className="flex items-center gap-3 shrink-0">
          {isFinished && (
            <span className="text-xs text-muted-foreground font-mono">
              {matchHomeScore}–{matchAwayScore}
            </span>
          )}
          <span className="text-sm font-mono font-bold">
            {saved ? `${home}–${away}` : `${predHomeScore}–${predAwayScore}`}
          </span>
          {cat ? (
            <span className={cn('text-xs font-semibold w-[72px] text-right', cat.color)}>
              {cat.label} {points !== null ? `+${points}` : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground w-[72px] text-right">
              {canEdit ? 'Editar →' : 'Pendiente'}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (canEdit) {
    return (
      <button className="block w-full text-left" onClick={() => setEditing(true)}>
        {inner}
      </button>
    )
  }

  return <Link href={`/matches/${matchId}`} className="block">{inner}</Link>
}
