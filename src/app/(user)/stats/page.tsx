import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Calendar, TrendingUp, Repeat } from 'lucide-react'

export default async function StatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ count: totalSessions }, { data: rounds }] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('round_scores')
      .select('total_score, round_id')
      .not('total_score', 'is', null),
  ])

  const scores = rounds?.map((r) => r.total_score).filter((s): s is number => s !== null) ?? []
  const totalArrows = scores.length * 3 // placeholder: 3 arrows per end approx
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const stats = [
    {
      label: 'Sesiones totales',
      value: totalSessions ?? 0,
      icon: Calendar,
      description: 'entrenamientos registrados',
    },
    {
      label: 'Flechas disparadas',
      value: totalArrows,
      icon: Target,
      description: 'flechas en total',
    },
    {
      label: 'Puntaje promedio',
      value: avgScore ?? '—',
      icon: TrendingUp,
      description: 'por ronda',
    },
    {
      label: 'Rondas completadas',
      value: scores.length,
      icon: Repeat,
      description: 'en todos los entrenamientos',
    },
  ]

  return (
    <div className="flex flex-col">
      <PageHeader title="Estadísticas" />

      <div className="grid grid-cols-2 gap-3 p-4">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
