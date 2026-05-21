import { db } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      memberships: {
        select: {
          joinedAt: true,
          totalScore: true,
          exactCount: true,
          status: true,
          room: { select: { name: true, code: true } },
        },
      },
      ownedRooms: {
        select: { name: true, code: true, createdAt: true, _count: { select: { members: true } } },
      },
      predictions: {
        orderBy: { updatedAt: 'desc' },
        take: 30,
        select: {
          homeScore: true,
          awayScore: true,
          points: true,
          category: true,
          updatedAt: true,
          match: {
            select: {
              kickoff: true,
              homeTeam: { select: { name: true, code: true } },
              awayTeam: { select: { name: true, code: true } },
            },
          },
        },
      },
    },
  })

  if (!user) notFound()

  const totalPoints = user.memberships.reduce((sum, m) => sum + m.totalScore, 0)

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Rol', value: user.role },
          { label: 'Verificado', value: user.emailVerified ? 'Sí' : 'No' },
          { label: 'Pronósticos', value: user.predictions.length + (user.predictions.length === 30 ? '+' : '') },
          { label: 'Puntos totales', value: totalPoints },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Salas donde participa */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Salas ({user.memberships.length})</h2>
        {user.memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin salas.</p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Sala</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Puntaje</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Exactos</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unido</th>
                </tr>
              </thead>
              <tbody>
                {user.memberships.map((m) => (
                  <tr key={m.room.code} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/rooms/${m.room.code}`} className="hover:underline font-medium">
                        {m.room.name}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">#{m.room.code}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        m.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                        m.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-destructive/20 text-destructive'
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-bold">{m.totalScore}</td>
                    <td className="px-4 py-2 text-center font-mono">{m.exactCount}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salas propias */}
      {user.ownedRooms.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Salas creadas ({user.ownedRooms.length})</h2>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Sala</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Miembros</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Creada</th>
                </tr>
              </thead>
              <tbody>
                {user.ownedRooms.map((r) => (
                  <tr key={r.code} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <Link href={`/rooms/${r.code}`} className="hover:underline font-medium">{r.name}</Link>
                      <span className="ml-2 text-xs text-muted-foreground">#{r.code}</span>
                    </td>
                    <td className="px-4 py-2 text-center font-mono">{r._count.members}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pronósticos */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Últimos pronósticos</h2>
        {user.predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pronósticos.</p>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Partido</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Pronóstico</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Puntos</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Categoría</th>
                </tr>
              </thead>
              <tbody>
                {user.predictions.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      <span className="font-medium">{p.match.homeTeam.code} vs {p.match.awayTeam.code}</span>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.match.kickoff).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-bold">
                      {p.homeScore} - {p.awayScore}
                    </td>
                    <td className="px-4 py-2 text-center font-mono">
                      {p.points ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-muted-foreground">
                      {p.category ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
