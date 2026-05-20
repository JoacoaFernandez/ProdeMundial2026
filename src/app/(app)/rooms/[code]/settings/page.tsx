import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = { params: Promise<{ code: string }> }

export default async function RoomSettingsPage({ params }: Props) {
  const session = await auth()
  const { code } = await params

  const room = await db.room.findUnique({
    where: { code: code.toUpperCase() },
  })

  if (!room) notFound()
  if (room.ownerId !== session!.user.id && session!.user.role !== 'ADMIN') redirect(`/rooms/${code}`)

  async function updateRoom(formData: FormData) {
    'use server'
    const name = (formData.get('name') as string).trim()
    const requireApproval = formData.get('requireApproval') === 'on'
    const isPublic = formData.get('isPublic') === 'on'
    const maxMembers = parseInt(formData.get('maxMembers') as string, 10) || 50

    if (!name || name.length < 3) return

    const { db: prisma } = await import('@/lib/db')
    await prisma.room.update({
      where: { code: code.toUpperCase() },
      data: { name, requireApproval, isPublic, maxMembers },
    })

    const { revalidatePath } = await import('next/cache')
    revalidatePath(`/rooms/${code}/settings`)
    revalidatePath(`/rooms/${code}`)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/rooms/${code}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{room.name}</CardTitle>
          <p className="text-xs font-mono text-muted-foreground">{room.code}</p>
        </CardHeader>
        <CardContent>
          <form action={updateRoom} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">Nombre</label>
              <input
                id="name"
                name="name"
                defaultValue={room.name}
                maxLength={50}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="maxMembers" className="text-sm font-medium">Máximo de miembros</label>
              <input
                id="maxMembers"
                name="maxMembers"
                type="number"
                min={2}
                max={500}
                defaultValue={room.maxMembers ?? 50}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="requireApproval"
                name="requireApproval"
                type="checkbox"
                defaultChecked={room.requireApproval}
                className="h-4 w-4"
              />
              <label htmlFor="requireApproval" className="text-sm">Requerir aprobación para nuevos miembros</label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                defaultChecked={room.isPublic}
                className="h-4 w-4"
              />
              <label htmlFor="isPublic" className="text-sm">Sala pública</label>
            </div>

            <Button type="submit" className="w-full">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
