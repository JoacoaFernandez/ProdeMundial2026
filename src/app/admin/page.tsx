import { db } from '@/lib/db'
import Link from 'next/link'
import { GenerateKnockoutButtons } from './GenerateKnockoutButtons'
import { SyncGlobalRoomButton } from './SyncGlobalRoomButton'

export default async function AdminPage() {
  const [userCount, matchCount, predictionCount, roomCount] = await Promise.all([
    db.user.count(),
    db.match.count(),
    db.prediction.count(),
    db.room.count(),
  ])

  const recentPredictions = await db.prediction.count({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel de administración</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Usuarios', value: userCount },
          { label: 'Partidos', value: matchCount },
          { label: 'Pronósticos', value: predictionCount },
          { label: 'Salas', value: roomCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Pronósticos últimas 24hs</p>
        <p className="text-2xl font-bold mt-1">{recentPredictions}</p>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold">Sala Global</h2>
        <SyncGlobalRoomButton />
      </div>

      <GenerateKnockoutButtons />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/matches"
          className="rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold">Partidos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Importar fixtures, cargar resultados y forzar recálculo.
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-lg border p-4 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ver todos los usuarios, sus salas y pronósticos.
          </p>
        </Link>
      </div>
    </div>
  )
}
