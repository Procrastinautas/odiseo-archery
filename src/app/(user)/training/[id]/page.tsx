import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { TrainingForm } from '@/components/training/TrainingForm'
import { ImprovementAreas } from '@/components/training/ImprovementAreas'
import { SessionActions } from '@/components/training/SessionActions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Pencil } from 'lucide-react'

const METHOD_LABELS: Record<string, string> = {
  manual: 'Manual',
  summary: 'Resumen',
  target_map: 'Mapa',
}

export default async function TrainingSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()

  const [
    { data: bows },
    { data: arrows },
    { data: rounds },
    { data: improvementAreas },
  ] = await Promise.all([
    supabase.from('bows').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('arrows').select('*').eq('user_id', user.id).order('created_at'),
    supabase
      .from('rounds')
      .select('*, round_scores(*)')
      .eq('training_session_id', id)
      .order('round_number'),
    supabase
      .from('improvement_areas')
      .select('*')
      .eq('training_session_id', id)
      .order('created_at'),
  ])

  const dateLabel = new Date(session.created_at).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex flex-col">
      <PageHeader title={dateLabel} />

      <div className="flex flex-col gap-4 p-4">
        {/* Session metadata form with auto-save */}
        <TrainingForm
          session={session}
          bows={bows ?? []}
          arrows={arrows ?? []}
        />

        {/* Rounds */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Rondas</p>
          {rounds?.length ? (
            rounds.map((round) => {
              const score = round.round_scores?.[0]
              return (
                <Link key={round.id} href={`/training/${id}/round/${round.id}`}>
                  <Card className="hover:bg-accent/30 transition-colors">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Ronda {round.round_number}</span>
                        {score && (
                          <Badge variant="secondary" className="text-xs">
                            {METHOD_LABELS[score.method] ?? score.method}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {score?.total_score != null && (
                          <span className="text-sm font-semibold">{score.total_score} pts</span>
                        )}
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">Aún no hay rondas. Agrega la primera.</p>
          )}
        </div>

        {/* Improvement areas */}
        <ImprovementAreas
          trainingSessionId={id}
          initialAreas={improvementAreas ?? []}
        />

        {/* Session actions */}
        <SessionActions trainingSessionId={id} />
      </div>
    </div>
  )
}
