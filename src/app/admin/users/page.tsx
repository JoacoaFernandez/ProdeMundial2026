import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      _count: {
        select: {
          predictions: true,
          memberships: true,
          ownedRooms: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold">Usuarios ({users.length})</h1>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Verificado</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pronósticos</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Salas</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Salas creadas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registrado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.emailVerified ? (
                    <span className="text-green-500">✓</span>
                  ) : (
                    <span className="text-destructive">✗</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-mono">{user._count.predictions}</td>
                <td className="px-4 py-3 text-center font-mono">{user._count.memberships}</td>
                <td className="px-4 py-3 text-center font-mono">{user._count.ownedRooms}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
