import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <div className="min-h-screen">
      <div className="border-b bg-muted/40">
        <div className="container mx-auto px-4 h-12 flex items-center gap-6">
          <span className="font-semibold text-sm">Admin</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/admin/matches" className="text-muted-foreground hover:text-foreground">
              Partidos
            </Link>
          </nav>
          <Link href="/" className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            ← Volver al app
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  )
}
