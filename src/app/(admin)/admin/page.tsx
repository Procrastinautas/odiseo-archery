import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import Link from 'next/link'
import { Calendar, Users, CreditCard, ChevronRight } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { count: pendingSessions },
    { count: pendingPayments },
    { count: totalUsers },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from('scheduled_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user'),
    supabase
      .from('scheduled_sessions')
      .select('id, date, status, profiles:user_id(name), locations:location_id(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const metrics = [
    {
      label: 'Sesiones pendientes',
      value: pendingSessions ?? 0,
      icon: Calendar,
      href: '/admin/sessions?status=pending',
      alert: (pendingSessions ?? 0) > 0,
    },
    {
      label: 'Pagos sin confirmar',
      value: pendingPayments ?? 0,
      icon: CreditCard,
      href: '/admin/sessions',
      alert: (pendingPayments ?? 0) > 0,
    },
    {
      label: 'Usuarios registrados',
      value: totalUsers ?? 0,
      icon: Users,
      href: '/admin/users',
      alert: false,
    },
  ]

  return (
    <div className="flex flex-col">
      <PageHeader title="Panel de administración" />

      <div className="flex flex-col gap-6 p-6">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4">
          {metrics.map(({ label, value, icon: Icon, href, alert }) => (
            <Link key={label} href={href}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{value}</span>
                    {alert && value > 0 && (
                      <Badge variant="destructive" className="mb-0.5">Acción requerida</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent sessions */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Actividad reciente</CardTitle>
            <Link href="/admin/sessions" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Ver todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSessions?.length ? (
              recentSessions.map((session) => (
                <Link key={session.id} href={`/admin/sessions/${session.id}`}>
                  <div className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-accent/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium">
                        {(session.profiles as unknown as { name: string } | null)?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.date} · {(session.locations as unknown as { name: string } | null)?.name}
                      </p>
                    </div>
                    <Badge
                      variant={
                        session.status === 'confirmed'
                          ? 'default'
                          : session.status === 'declined'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {session.status === 'pending'
                        ? 'Pendiente'
                        : session.status === 'confirmed'
                        ? 'Confirmada'
                        : session.status === 'declined'
                        ? 'Rechazada'
                        : 'Cancelada'}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sin actividad reciente
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
