'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: object[]
  }
}

export function AdBanner({ className = '' }: { className?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT
  const pushed = useRef(false)

  useEffect(() => {
    if (!client || !slot || pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [client, slot])

  if (!client || !slot) return null

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
