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

  const now = new Date()

  // Always read name/email from DB so profile updates reflect immediately
  const [dbUser, activeGroupRound, firstActiveKnockout] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    // First non-finished GROUP matchday
    db.match.findFirst({
      where: { stage: 'GROUP', status: { notIn: ['FINISHED', 'CANCELLED'] }, matchday: { not: null } },
      orderBy: { matchday: 'asc' },
      select: { matchday: true },
    }),
    // First upcoming knockout match
    db.match.findFirst({
      where: { stage: { in: ['R32', 'R16', 'QF', 'SF', 'THIRD', 'FINAL'] }, status: { notIn: ['FINISHED', 'CANCELLED'] }, lockAt: { gt: now } },
      orderBy: { kickoff: 'asc' },
      select: { stage: true },
    }),
  ])

  // Count unpredicted matches in the active round only
  let pendingInCurrentRound = 0
  if (activeGroupRound?.matchday != null) {
    pendingInCurrentRound = await db.match.count({
      where: {
        stage: 'GROUP',
        matchday: activeGroupRound.matchday,
        lockAt: { gt: now },
        predictions: { none: { userId: session.user.id } },
      },
    })
  } else if (firstActiveKnockout) {
    pendingInCurrentRound = await db.match.count({
      where: {
        stage: firstActiveKnockout.stage,
        lockAt: { gt: now },
        predictions: { none: { userId: session.user.id } },
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{ ...session.user, name: dbUser?.name ?? session.user.name, email: dbUser?.email ?? session.user.email }}
        pendingCount={pendingInCurrentRound}
      />
      <main className="flex-1 container mx-auto px-4 py-6 pb-20 md:pb-6">{children}</main>
      <BottomNav pendingCount={pendingInCurrentRound} />
    </div>
  )
}
