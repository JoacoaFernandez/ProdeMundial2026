import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const session = await auth()

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    include: {
      favoriteTeam: true,
      _count: { select: { predictions: true, memberships: { where: { status: 'APPROVED' } } } },
    },
  })

  if (!user) redirect('/login')

  const stats = await db.prediction.aggregate({
    where: { userId: user.id, points: { not: null } },
    _sum: { points: true },
    _count: { points: true },
  })

  const exactCount = await db.prediction.count({
    where: { userId: user.id, category: 'EXACT' },
  })

  const teams = await db.team.findMany({ orderBy: { name: 'asc' } })

  async function updateProfile(formData: FormData) {
    'use server'
    const name = (formData.get('name') as string).trim()
    const favoriteTeamId = (formData.get('favoriteTeamId') as string) || null

    if (!name || name.length < 2) return

    const { auth: getAuth } = await import('@/lib/auth')
    const { db: prisma } = await import('@/lib/db')
    const s = await getAuth()
    if (!s) return

    await prisma.user.update({
      where: { id: s.user.id },
      data: { name, favoriteTeamId },
    })

    const { revalidatePath } = await import('next/cache')
    const { redirect } = await import('next/navigation')
    revalidatePath('/profile')
    redirect('/profile')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{stats._sum.points ?? 0}</p>
          <p className="text-xs text-muted-foreground">Puntos totales</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{exactCount}</p>
          <p className="text-xs text-muted-foreground">Exactos</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{user._count.memberships}</p>
          <p className="text-xs text-muted-foreground">Salas</p>
        </div>
      </div>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">Nombre</label>
              <input
                id="name"
                name="name"
                defaultValue={user.name}
                maxLength={50}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                disabled
                value={user.email}
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="favoriteTeamId" className="text-sm font-medium">Equipo favorito</label>
              <select
                id="favoriteTeamId"
                name="favoriteTeamId"
                defaultValue={user.favoriteTeamId ?? ''}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Sin equipo favorito</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                {user.hasProPass && <Badge>Pro</Badge>}
              </div>
              <Button type="submit" size="sm">Guardar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
