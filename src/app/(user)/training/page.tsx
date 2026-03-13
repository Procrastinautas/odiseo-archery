import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import Link from 'next/link'
import { Plus, Target } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  control: 'Control',
  training: 'Entrenamiento',
  contest: 'Competencia',
}

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Soleado',
  cloudy: 'Nublado',
  rainy: 'Lluvioso',
  heavy_rain: 'Lluvia fuerte',
  windy: 'Ventoso',
}

export default async function TrainingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*, bows(type)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Entrenamientos"
        action={
          <Link href="/training/new" className={buttonVariants({ size: 'sm' })}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Link>
        }
      />

      <div className="flex flex-col gap-3 p-4">
        {sessions?.length ? (
          sessions.map((session) => (
            <Link key={session.id} href={`/training/${session.id}`}>
              <Card className="hover:bg-accent/30 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-sm">
                        {new Date(session.created_at).toLocaleDateString('es-CO', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          session.distance ? `${session.distance}m` : null,
                          session.weather ? WEATHER_LABELS[session.weather] : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {session.type && (
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[session.type]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Target className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Aún no tienes entrenamientos registrados</p>
              <Link href="/training/new" className={buttonVariants({ size: 'sm' })}>
                <Plus className="mr-1.5 h-4 w-4" />
                Iniciar entreno
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
