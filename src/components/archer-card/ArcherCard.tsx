import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface ArcherCardProps {
  name: string
  email: string
  pictureUrl?: string | null
  bowType?: string | null
  hand?: string | null
  totalSessions?: number
  totalArrows?: number
  compact?: boolean
}

const BOW_LABELS: Record<string, string> = {
  recurve: 'Recurvo',
  compound: 'Compuesto',
  barebow: 'Arco Desnudo',
}

const HAND_LABELS: Record<string, string> = {
  left: 'Zurdo',
  right: 'Diestro',
}

export function ArcherCard({
  name,
  email,
  pictureUrl,
  bowType,
  hand,
  totalSessions,
  totalArrows,
  compact = false,
}: ArcherCardProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const bowLabel = bowType ? BOW_LABELS[bowType] : null
  const handLabel = hand ? HAND_LABELS[hand] : null

  return (
    <Card className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-700 text-white border-0 shadow-lg">
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="flex items-start gap-4">
          <Avatar className={compact ? 'h-14 w-14' : 'h-20 w-20 border-2 border-white/20'}>
            <AvatarImage src={pictureUrl ?? undefined} alt={name} />
            <AvatarFallback className="bg-slate-600 text-white text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold truncate ${compact ? 'text-base' : 'text-xl'}`}>{name}</h2>
            <p className="text-slate-300 text-sm truncate">{email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {bowLabel && (
                <Badge className="bg-white/15 text-white border-0 text-xs hover:bg-white/20">
                  {bowLabel}
                </Badge>
              )}
              {handLabel && (
                <Badge className="bg-white/15 text-white border-0 text-xs hover:bg-white/20">
                  {handLabel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!compact && (totalSessions !== undefined || totalArrows !== undefined) && (
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10">
            {totalSessions !== undefined && (
              <div className="text-center">
                <p className="text-3xl font-bold">{totalSessions}</p>
                <p className="text-slate-300 text-xs mt-0.5 uppercase tracking-wide">Sesiones</p>
              </div>
            )}
            {totalArrows !== undefined && (
              <div className="text-center">
                <p className="text-3xl font-bold">{totalArrows}</p>
                <p className="text-slate-300 text-xs mt-0.5 uppercase tracking-wide">Flechas</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
