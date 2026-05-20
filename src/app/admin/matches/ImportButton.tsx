'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function ImportButton({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleImport() {
    if (!confirm('¿Importar todos los fixtures desde API-Football?')) return

    setLoading(true)
    setResult(null)

    const res = await fetch('/api/admin/matches/import', { method: 'POST' })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setResult(`Error: ${data.error}`)
    } else {
      setResult(`Importados: ${data.imported}, omitidos: ${data.skipped}`)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-muted-foreground">{result}</span>}
      <Button variant="outline" size="sm" onClick={handleImport} disabled={disabled || loading}>
        {loading ? 'Importando...' : 'Importar fixtures'}
      </Button>
    </div>
  )
}
