'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

export function SyncGlobalRoomButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/sync-global-room', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setResult(`${data.created ? 'Sala creada. ' : ''}${data.enrolled} usuarios enrollados.`)
      } else {
        setResult('Error al sincronizar.')
      }
    } catch {
      setResult('Error de red.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">Sala Global (Mundial 2026 — Global)</p>
        <p className="text-xs text-muted-foreground">
          Crea la sala global y enrolla a todos los usuarios verificados. Los nuevos usuarios se agregan automáticamente al registrarse.
        </p>
        {result && <p className="text-xs text-green-500 mt-0.5">{result}</p>}
      </div>
      <button
        onClick={handleSync}
        disabled={loading}
        className="shrink-0 flex items-center gap-1.5 rounded-md border border-primary/50 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
      >
        <Globe className="size-3.5" />
        {loading ? 'Sincronizando...' : 'Sincronizar'}
      </button>
    </div>
  )
}
