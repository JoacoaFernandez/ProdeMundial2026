'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

export function ShareRoomButton({ code, roomName }: { code: string; roomName: string }) {
  const [copied, setCopied] = useState(false)

  const url = `${window.location.origin}/join/${code}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unite a ${roomName} — Prode Mundial 2026`,
          text: `¡Jugá el prode conmigo! Usá el código ${code} para unirte.`,
          url,
        })
        return
      } catch {
        // user cancelled, fall through to copy
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
    >
      {copied ? (
        <>
          <Check className="size-4 text-green-500" />
          <span className="text-green-500">¡Copiado!</span>
        </>
      ) : (
        <>
          <Share2 className="size-4" />
          Compartir
        </>
      )}
    </button>
  )
}
