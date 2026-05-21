import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'
import BottomNav from '@/components/shared/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  // Always read name/email from DB so profile updates reflect immediately
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={{ ...session.user, name: dbUser?.name ?? session.user.name, email: dbUser?.email ?? session.user.email }} />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  )
}
