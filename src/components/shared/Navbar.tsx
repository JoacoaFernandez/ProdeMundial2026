'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export default function Navbar({ user }: NavbarProps) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-anybody)] font-black uppercase tracking-tighter text-primary text-lg">
          WC2026 PREDICTOR
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/matches" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Partidos
          </Link>
          <Link href="/rooms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Salas
          </Link>
          <Link href="/ranking" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Ranking
          </Link>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarFallback className="text-xs bg-muted text-primary font-bold">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-muted-foreground hover:text-primary"
          >
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
