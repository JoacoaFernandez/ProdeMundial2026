'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

export function JoinRoomDialog({ asInline = false }: { asInline?: boolean }) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 8) {
      setError('Código de 8 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/rooms/by-code/${trimmed}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Sala no encontrada.')
        return
      }
      const room = await res.json()

      const joinRes = await fetch(`/api/rooms/${room.id}/join`, { method: 'POST' })
      const joinData = await joinRes.json()

      if (!joinRes.ok) {
        setError(joinData.error ?? 'No se pudo unir a la sala.')
        return
      }

      setOpen(false)
      setCode('')

      if (joinData.status === 'APPROVED') {
        router.push(`/rooms/${trimmed}`)
      } else {
        router.refresh()
        alert(joinData.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (asInline) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
        <Input
          placeholder="XXXXXXXX"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
          maxLength={8}
          className="font-mono tracking-widest uppercase text-xs h-8 min-w-0"
        />
        <Button type="submit" size="sm" disabled={loading} className="h-8 shrink-0 text-xs px-3">
          {loading ? '...' : 'Entrar'}
        </Button>
        {error && <p className="absolute text-xs text-destructive mt-9">{error}</p>}
      </form>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Unirse con código
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse a una sala</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="room-code">Código de sala</Label>
            <Input
              id="room-code"
              placeholder="XXXXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono tracking-widest uppercase"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Buscando...' : 'Unirse'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
