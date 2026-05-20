'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewRoomPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [maxMembers, setMaxMembers] = useState('50')
  const [requireApproval, setRequireApproval] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        requireApproval,
        isPublic,
        maxMembers: parseInt(maxMembers, 10) || 50,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'No se pudo crear la sala.')
      return
    }

    router.push(`/rooms/${data.code}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nueva sala</h1>
        <p className="text-sm text-muted-foreground">Creá tu sala y compartí el código con tus amigos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre de la sala</Label>
              <Input
                id="name"
                placeholder="Ej: La familia"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="max-members">Máximo de miembros</Label>
              <Input
                id="max-members"
                type="number"
                min={2}
                max={500}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium">Aprobación manual</p>
                <p className="text-xs text-muted-foreground">Los nuevos miembros necesitan tu OK</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={requireApproval}
                onClick={() => setRequireApproval(!requireApproval)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${requireApproval ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${requireApproval ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium">Sala pública</p>
                <p className="text-xs text-muted-foreground">Aparece en el listado global</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-primary' : 'bg-muted'}`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear sala'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
