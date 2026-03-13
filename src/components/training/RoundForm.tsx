'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertRoundScore } from '@/actions/training'
import { ScoreInput } from '@/components/training/ScoreInput'
import type { ScoreResult } from '@/components/training/ScoreInput'
import { Button } from '@/components/ui/button'
import type { Database, Json } from '@/types/database'

type RoundScore = Database['public']['Tables']['round_scores']['Row']

interface Props {
  roundId: string
  roundNumber: number
  trainingSessionId: string
  existingScore: RoundScore | null
}

export function RoundForm({ roundId, roundNumber, trainingSessionId, existingScore }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit() {
    if (!result) return
    setError(null)
    startTransition(async () => {
      const res = await upsertRoundScore(roundId, {
        method: result.method,
        data: result.data as unknown as Json,
        total_score: result.total_score,
        tens: result.tens,
        xs: result.xs,
        nines: result.nines,
        below_8_count: result.below_8_count,
        misses: result.misses,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      router.push(`/training/${trainingSessionId}`)
    })
  }

  const initialMethod = existingScore
    ? (existingScore.method as 'manual' | 'summary')
    : 'manual'

  const initialData = existingScore ? existingScore.data : null

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        Ingresa el puntaje para la ronda {roundNumber}
      </p>

      <ScoreInput
        initialMethod={initialMethod}
        initialData={initialData as Parameters<typeof ScoreInput>[0]['initialData']}
        onChange={setResult}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/training/${trainingSessionId}`)}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isPending || !result}
        >
          {isPending ? 'Guardando...' : 'Guardar ronda'}
        </Button>
      </div>
    </div>
  )
}
