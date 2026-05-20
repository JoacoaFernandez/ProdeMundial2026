import { auth } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Hola, {session?.user?.name}!
        </h1>
        <p className="text-muted-foreground">
          Bienvenido al PRODE Mundial FIFA 2026
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">Próximos partidos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Los fixtures estarán disponibles cuando comience el Mundial.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">Mis salas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Creá o unite a una sala para competir con amigos.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold">Ranking global</h2>
          <p className="text-sm text-muted-foreground mt-1">
            El ranking se actualizará con los resultados del torneo.
          </p>
        </div>
      </div>
    </div>
  )
}
