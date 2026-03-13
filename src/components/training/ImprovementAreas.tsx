'use client'

import { useState, useTransition } from 'react'
import { createImprovementArea, deleteImprovementArea } from '@/actions/training'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus } from 'lucide-react'
import type { Database } from '@/types/database'

type ImprovementArea = Database['public']['Tables']['improvement_areas']['Row']

interface Props {
  trainingSessionId: string
  initialAreas: ImprovementArea[]
}

export function ImprovementAreas({ trainingSessionId, initialAreas }: Props) {
  const [areas, setAreas] = useState(initialAreas)
  const [newComment, setNewComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    const trimmed = newComment.trim()
    if (!trimmed) return
    startTransition(async () => {
      const result = await createImprovementArea(trainingSessionId, trimmed)
      if (!result.error) {
        // Optimistically add with temp id; page revalidation will sync
        setAreas((prev) => [
          ...prev,
          { id: crypto.randomUUID(), training_session_id: trainingSessionId, comment: trimmed, attachment_url: null, created_at: new Date().toISOString() },
        ])
        setNewComment('')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteImprovementArea(id)
      setAreas((prev) => prev.filter((a) => a.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Áreas a mejorar</p>
      {areas.map((area) => (
        <div key={area.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
          <span className="flex-1 text-sm">{area.comment}</span>
          <button
            type="button"
            onClick={() => handleDelete(area.id)}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Agregar área a mejorar..."
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          className="text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={isPending || !newComment.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
