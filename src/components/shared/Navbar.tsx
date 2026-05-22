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
  pendingCount?: number
}

export default function Navbar({ user, pendingCount = 0 }: NavbarProps) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-anybody)] font-black uppercase tracking-tighter text-primary text-lg">
          PRODE MUNDIAL 2026
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/grupos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Grupos
          </Link>
          <Link href="/bracket" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Llaves
          </Link>
          <Link
            href={pendingCount > 0 ? '/matches?pending=1' : '/matches'}
            className="relative text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Partidos
            {pendingCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
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
          <Link href="/profile">
            <Avatar className="h-8 w-8 border border-primary/30 hover:border-primary transition-colors cursor-pointer">
              <AvatarFallback className="text-xs bg-muted text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
          </Link>
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
