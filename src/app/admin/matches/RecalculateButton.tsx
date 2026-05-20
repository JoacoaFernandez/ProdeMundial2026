'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function RecalculateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleRecalculate() {
    if (!confirm('¿Recalcular todos los puntos desde cero? Esto resetea los scores de todos los miembros.')) return

    setLoading(true)
    setResult(null)

    const res = await fetch('/api/admin/recalculate', { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setResult(`Error: ${data.error}`)
    } else {
      setResult(`${data.matchesProcessed} partidos, ${data.predictionsScored} pronósticos`)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
      <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={loading}>
        {loading ? 'Recalculando...' : 'Recalcular todos'}
      </Button>
    </div>
  )
}
