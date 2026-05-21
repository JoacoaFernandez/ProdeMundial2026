'use client'

import { useState } from 'react'

const ROUNDS = [
  { key: 'R32',   label: 'Generar R32 (Dieciseisavos)',  desc: 'Requiere fase de grupos completa' },
  { key: 'R16',   label: 'Generar Octavos de Final',     desc: 'Requiere R32 completo' },
  { key: 'QF',    label: 'Generar Cuartos de Final',     desc: 'Requiere Octavos completo' },
  { key: 'SF',    label: 'Generar Semifinales',          desc: 'Requiere Cuartos completo' },
  { key: 'FINAL', label: 'Generar Final + 3er puesto',   desc: 'Requiere Semifinales completo' },
]

export function GenerateKnockoutButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})

  async function handleGenerate(round: string) {
    if (!confirm(`¿Generar partidos de ${round}? Esta acción crea partidos en la base de datos.`)) return
    setLoading(round)
    try {
      const res = await fetch('/api/admin/generate-knockout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round }),
      })
      const data = await res.json()
      if (data.ok) {
        setResults((prev) => ({
          ...prev,
          [round]: `✓ ${data.created} creados, ${data.skipped} existentes${data.errors?.length ? ` · ${data.errors.length} errores` : ''}`,
        }))
      } else {
        setResults((prev) => ({ ...prev, [round]: `✗ Error: ${data.error}` }))
      }
    } catch {
      setResults((prev) => ({ ...prev, [round]: '✗ Error de red' }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h2 className="font-semibold">Fase Eliminatoria — Generar Partidos</h2>
      <p className="text-xs text-muted-foreground">
        Crea automáticamente los cruces de cada ronda basándose en los resultados de la fase anterior.
        Para partidos que terminan en penales, configurá el ganador en el partido antes de generar la siguiente ronda.
      </p>
      <div className="space-y-2">
        {ROUNDS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
              {results[key] && (
                <p className={`text-xs mt-0.5 ${results[key].startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                  {results[key]}
                </p>
              )}
            </div>
            <button
              onClick={() => handleGenerate(key)}
              disabled={loading !== null}
              className="shrink-0 rounded-md border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {loading === key ? 'Generando...' : 'Generar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
