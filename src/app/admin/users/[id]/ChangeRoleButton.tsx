'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldOff } from 'lucide-react'

export function ChangeRoleButton({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  async function handleChange() {
    const newRole = role === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`¿Cambiar rol a ${newRole}?`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (res.ok) setRole(newRole)
    setLoading(false)
  }

  return (
    <button
      onClick={handleChange}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        role === 'ADMIN'
          ? 'border-destructive/40 text-destructive hover:bg-destructive/10'
          : 'border-primary/40 text-primary hover:bg-primary/10'
      }`}
    >
      {role === 'ADMIN' ? (
        <><ShieldOff className="size-4" /> Quitar admin</>
      ) : (
        <><ShieldCheck className="size-4" /> Hacer admin</>
      )}
    </button>
  )
}
