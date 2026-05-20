import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type RoomCardProps = {
  id: string
  name: string
  code: string
  memberCount: number
  maxMembers: number | null
  myScore: number
  isOwner: boolean
  requireApproval: boolean
}

export function RoomCard({ name, code, memberCount, maxMembers, myScore, isOwner, requireApproval }: RoomCardProps) {
  return (
    <Link href={`/rooms/${code}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{name}</CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              {isOwner && <Badge variant="secondary">Tuya</Badge>}
              {requireApproval && <Badge variant="outline">Aprobación</Badge>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-mono">{code}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {memberCount}
              {maxMembers ? `/${maxMembers}` : ''} miembros
            </span>
            <span className="font-semibold text-foreground">{myScore} pts</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
