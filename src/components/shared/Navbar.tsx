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
    <header className="border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          PRODE 2026
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link href="/matches" className="text-sm text-muted-foreground hover:text-foreground">
            Partidos
          </Link>
          <Link href="/rooms" className="text-sm text-muted-foreground hover:text-foreground">
            Salas
          </Link>
          <Link href="/ranking" className="text-sm text-muted-foreground hover:text-foreground">
            Ranking
          </Link>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
