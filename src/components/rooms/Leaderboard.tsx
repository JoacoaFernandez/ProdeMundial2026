import { cn } from '@/lib/utils'

type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  totalScore: number
  exactCount: number
  isMe: boolean
}

type LeaderboardProps = {
  entries: LeaderboardEntry[]
}

export function Leaderboard({ entries }: LeaderboardProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No hay miembros aprobados aún.</p>
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2 font-medium w-10">#</th>
            <th className="text-left px-4 py-2 font-medium">Jugador</th>
            <th className="text-right px-4 py-2 font-medium">Exactos</th>
            <th className="text-right px-4 py-2 font-medium">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.userId}
              className={cn('border-b last:border-0', entry.isMe && 'bg-primary/5 font-medium')}
            >
              <td className="px-4 py-3 text-muted-foreground">
                {entry.rank <= 3 ? (
                  <span>{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                ) : (
                  entry.rank
                )}
              </td>
              <td className="px-4 py-3">
                {entry.name}
                {entry.isMe && <span className="ml-1 text-xs text-muted-foreground">(vos)</span>}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{entry.exactCount}</td>
              <td className="px-4 py-3 text-right font-semibold">{entry.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
