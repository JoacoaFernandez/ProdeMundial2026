import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { GLOBAL_ROOM_CODE } from '@/lib/global-room'
import Link from 'next/link'

const PAGE_SIZE = 50

type Props = { searchParams: Promise<{ page?: string }> }

export default async function RankingPage({ searchParams }: Props) {
  const session = await auth()
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1', 10))
  const skip = (currentPage - 1) * PAGE_SIZE

  const globalRoom = await db.room.findUnique({
    where: { code: GLOBAL_ROOM_CODE },
    select: { id: true },
  })

  let totalCount = 0
  let ranking: { rank: number; userId: string; name: string; totalScore: number; exactCount: number; predictions: number; isMe: boolean }[] = []
  let myEntry: (typeof ranking)[0] | null = null

  if (globalRoom) {
    totalCount = await db.roomMember.count({
      where: { roomId: globalRoom.id, status: 'APPROVED' },
    })

    const members = await db.roomMember.findMany({
      where: { roomId: globalRoom.id, status: 'APPROVED' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ totalScore: 'desc' }, { exactCount: 'desc' }],
      take: PAGE_SIZE,
      skip,
    })

    const predCounts = await db.prediction.groupBy({
      by: ['userId'],
      where: { userId: { in: members.map((m) => m.userId) } },
      _count: { id: true },
    })
    const predMap = Object.fromEntries(predCounts.map((p) => [p.userId, p._count.id]))

    ranking = members.map((m, i) => ({
      rank: skip + i + 1,
      userId: m.userId,
      name: m.user.name,
      totalScore: m.totalScore,
      exactCount: m.exactCount,
      predictions: predMap[m.userId] ?? 0,
      isMe: m.userId === session!.user.id,
    }))

    // Always fetch my entry if not on current page
    const meInPage = ranking.find((r) => r.isMe)
    if (!meInPage) {
      const myMember = await db.roomMember.findUnique({
        where: { userId_roomId: { userId: session!.user.id, roomId: globalRoom.id } },
        include: { user: { select: { id: true, name: true } } },
      })
      if (myMember) {
        const myRank = await db.roomMember.count({
          where: {
            roomId: globalRoom.id,
            status: 'APPROVED',
            OR: [
              { totalScore: { gt: myMember.totalScore } },
              { totalScore: myMember.totalScore, exactCount: { gt: myMember.exactCount } },
            ],
          },
        })
        const myPreds = await db.prediction.count({ where: { userId: session!.user.id } })
        myEntry = {
          rank: myRank + 1,
          userId: myMember.userId,
          name: myMember.user.name,
          totalScore: myMember.totalScore,
          exactCount: myMember.exactCount,
          predictions: myPreds,
          isMe: true,
        }
      }
    } else {
      myEntry = meInPage
    }
  } else {
    // Fallback: compute from predictions directly
    const stats = await db.prediction.groupBy({
      by: ['userId'],
      where: { points: { not: null } },
      _sum: { points: true },
      _count: { id: true },
      orderBy: { _sum: { points: 'desc' } },
      take: PAGE_SIZE,
      skip,
    })

    totalCount = await db.prediction.groupBy({
      by: ['userId'],
      where: { points: { not: null } },
    }).then((r) => r.length)

    const exactCounts = await db.prediction.groupBy({
      by: ['userId'],
      where: { category: 'EXACT', userId: { in: stats.map((s) => s.userId) } },
      _count: { id: true },
    })
    const users = await db.user.findMany({
      where: { id: { in: stats.map((s) => s.userId) } },
      select: { id: true, name: true },
    })
    const exactMap = Object.fromEntries(exactCounts.map((e) => [e.userId, e._count.id]))
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]))

    ranking = stats.map((s, i) => ({
      rank: skip + i + 1,
      userId: s.userId,
      name: userMap[s.userId] ?? 'Usuario',
      totalScore: s._sum.points ?? 0,
      exactCount: exactMap[s.userId] ?? 0,
      predictions: s._count.id,
      isMe: s.userId === session!.user.id,
    }))
    myEntry = ranking.find((r) => r.isMe) ?? null
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking global</h1>
        <p className="text-sm text-muted-foreground">{totalCount} participantes</p>
      </div>

      {myEntry && (
        <div className="rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Tu posición</p>
            <p className="text-3xl font-bold">#{myEntry.rank}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Pronósticos</p>
            <p className="text-2xl font-bold">{myEntry.predictions}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Exactos</p>
            <p className="text-2xl font-bold">{myEntry.exactCount}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Puntos</p>
            <p className="text-3xl font-bold">{myEntry.totalScore}</p>
          </div>
        </div>
      )}

      {ranking.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          Aún no hay puntos calculados. Los rankings se actualizan al finalizar cada partido.
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium w-12">#</th>
                  <th className="text-left px-4 py-3 font-medium">Jugador</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Pronósticos</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Exactos</th>
                  <th className="text-right px-4 py-3 font-medium">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={cn(
                      'border-b last:border-0 transition-colors',
                      entry.isMe ? 'bg-primary/5 font-semibold' : 'hover:bg-muted/30',
                    )}
                  >
                    <td className="px-4 py-3 text-muted-foreground w-12">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </td>
                    <td className="px-4 py-3">
                      <span>{entry.name}</span>
                      {entry.isMe && (
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">(vos)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {entry.predictions}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {entry.exactCount}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{entry.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/ranking?page=${currentPage - 1}`}
                    className="px-3 py-1.5 rounded border text-sm hover:bg-muted transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/ranking?page=${currentPage + 1}`}
                    className="px-3 py-1.5 rounded border text-sm hover:bg-muted transition-colors"
                  >
                    Siguiente →
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
