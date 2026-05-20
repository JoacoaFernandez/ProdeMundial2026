'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function ImportButton({ disabled }: { disabled: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function doImport(endpoint: string, label: string) {
    if (!confirm(`¿${label}?`)) return
    setLoading(true)
    setResult(null)
    const res = await fetch(endpoint, { method: 'POST' })
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
      <Button
        variant="outline"
        size="sm"
        onClick={() => doImport('/api/admin/matches/import-local', 'Importar fixtures desde matches.json local')}
        disabled={loading}
      >
        {loading ? 'Importando...' : 'Importar local'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => doImport('/api/admin/matches/import', 'Importar fixtures desde API de Football-Data')}
        disabled={disabled || loading}
      >
        {loading ? 'Importando...' : 'Importar API'}
      </Button>
    </div>
  )
}
