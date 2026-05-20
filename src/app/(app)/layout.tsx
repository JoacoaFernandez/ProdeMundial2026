import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
