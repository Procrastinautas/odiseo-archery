import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  declined: 'Rechazada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  declined: 'destructive',
  cancelled: 'outline',
}

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('scheduled_sessions')
    .select('*, locations(name)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const upcoming = sessions?.filter(
    (s) => ['pending', 'confirmed'].includes(s.status) && s.date >= new Date().toISOString().split('T')[0]
  )
  const past = sessions?.filter(
    (s) => !upcoming?.find((u) => u.id === s.id)
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Sesiones"
        action={
          <Link href="/sessions/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Link>
        }
      />

      <div className="flex flex-col gap-6 p-4">
        {/* Upcoming */}
        {!!upcoming?.length && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Próximas
            </h2>
            {upcoming.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </section>
        )}

        {/* Past */}
        {!!past?.length && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
              Anteriores
            </h2>
            {past.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </section>
        )}

        {!sessions?.length && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Aún no tienes sesiones agendadas</p>
              <Link href="/sessions/new" className={buttonVariants({ size: 'sm' })}>
                <Plus className="mr-1.5 h-4 w-4" />
                Agendar sesión
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

type Session = {
  id: string
  date: string
  time: string
  distance: number
  status: string
  locations: { name: string } | null
}

function SessionCard({ session }: { session: Session }) {
  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="hover:bg-accent/30 transition-colors">
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div>
            <p className="font-medium text-sm">
              {new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.time?.slice(0, 5)} · {session.distance}m · {session.locations?.name}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[session.status]}>
            {STATUS_LABELS[session.status]}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
