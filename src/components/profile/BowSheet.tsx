'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { addBow, updateBow, addScopeMark, deleteScopeMark } from '@/actions/profile'
import { toast } from 'sonner'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Bow = Database['public']['Tables']['bows']['Row']
type ScopeMark = Database['public']['Tables']['scope_marks']['Row']

const bowSchema = z.object({
  type: z.enum(['recurve', 'compound', 'barebow']),
  hand: z.enum(['left', 'right']),
  // Stored as string (HTML number input); parsed to number in submit handler
  draw_weight: z.string().optional(),
  notes: z.string().optional(),
})
type BowFormValues = z.infer<typeof bowSchema>

interface BowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bow?: Bow | null
  scopeMarks?: ScopeMark[]
  onSaved: (bow: Bow) => void
}

const BOW_TYPES = [
  { value: 'recurve', label: 'Recurvo' },
  { value: 'compound', label: 'Compuesto' },
  { value: 'barebow', label: 'Arco Desnudo' },
]

const HAND_OPTIONS = [
  { value: 'right', label: 'Diestro (derecha)' },
  { value: 'left', label: 'Zurdo (izquierda)' },
]

const SELECT_CLS =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function BowSheet({
  open,
  onOpenChange,
  bow,
  scopeMarks: initialMarks = [],
  onSaved,
}: BowSheetProps) {
  const isEdit = !!bow

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BowFormValues>({
    resolver: zodResolver(bowSchema),
    defaultValues: bow
      ? {
          type: bow.type,
          hand: bow.hand,
          draw_weight: bow.draw_weight != null ? String(bow.draw_weight) : '',
          notes: bow.notes ?? '',
        }
      : { type: 'recurve', hand: 'right', draw_weight: '', notes: '' },
  })

  // Scope marks for edit mode (immediate save/delete)
  const [marks, setMarks] = useState<ScopeMark[]>(initialMarks)
  // Pending marks for new bow mode (saved together on bow creation)
  const [pendingMarks, setPendingMarks] = useState<{ distance: number; mark_value: string }[]>([])
  const [newDistance, setNewDistance] = useState('')
  const [newMarkValue, setNewMarkValue] = useState('')
  const [marksPending, startMarkTransition] = useTransition()
  const [saving, startSave] = useTransition()

  function handleAddMark() {
    const dist = parseInt(newDistance, 10)
    if (!dist || dist <= 0 || !newMarkValue.trim()) {
      toast.error('Completá distancia y valor de mira')
      return
    }
    if (isEdit && bow) {
      startMarkTransition(async () => {
        try {
          const mark = await addScopeMark({
            bow_id: bow.id,
            distance: dist,
            mark_value: newMarkValue.trim(),
          })
          setMarks((prev) => [...prev, mark])
          setNewDistance('')
          setNewMarkValue('')
        } catch {
          toast.error('Error al guardar la mira')
        }
      })
    } else {
      setPendingMarks((prev) => [...prev, { distance: dist, mark_value: newMarkValue.trim() }])
      setNewDistance('')
      setNewMarkValue('')
    }
  }

  function handleDeleteMark(id: string) {
    startMarkTransition(async () => {
      try {
        await deleteScopeMark(id)
        setMarks((prev) => prev.filter((m) => m.id !== id))
      } catch {
        toast.error('Error al eliminar la mira')
      }
    })
  }

  function onSubmit(values: BowFormValues) {
    startSave(async () => {
      try {
        let savedBow: Bow
        const parsedWeight = values.draw_weight ? parseFloat(values.draw_weight) : null
        const payload = {
          hand: values.hand,
          type: values.type,
          draw_weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : null,
          notes: values.notes || null,
        }
        if (isEdit && bow) {
          await updateBow(bow.id, payload)
          savedBow = { ...bow, ...payload, draw_weight: payload.draw_weight ?? bow.draw_weight }
        } else {
          savedBow = await addBow(payload)
          for (const mark of pendingMarks) {
            await addScopeMark({ bow_id: savedBow.id, ...mark })
          }
        }
        toast.success(isEdit ? 'Arco actualizado' : 'Arco agregado')
        onSaved(savedBow)
        onOpenChange(false)
      } catch (err) {
        toast.error('Error al guardar el arco')
        console.error(err)
      }
    })
  }

  const allMarks = isEdit ? marks : pendingMarks.map((m, i) => ({ ...m, id: `pending-${i}` }))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar arco' : 'Agregar arco'}</SheetTitle>
        </SheetHeader>

        {/* Use `contents` so form children participate directly in SheetContent's flex layout */}
        <form onSubmit={handleSubmit(onSubmit)} className="contents">
          <div className="flex flex-col gap-4 px-4">
            {/* Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bow-type">Tipo</Label>
              <select id="bow-type" {...register('type')} className={SELECT_CLS}>
                {BOW_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            {/* Hand */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bow-hand">Mano dominante</Label>
              <select id="bow-hand" {...register('hand')} className={SELECT_CLS}>
                {HAND_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.hand && <p className="text-xs text-destructive">{errors.hand.message}</p>}
            </div>

            {/* Draw weight */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bow-draw-weight">Poundaje (lb)</Label>
              <Input
                id="bow-draw-weight"
                type="number"
                step="0.5"
                min="1"
                placeholder="Ej. 28"
                {...register('draw_weight')}
              />
              {errors.draw_weight && (
                <p className="text-xs text-destructive">{errors.draw_weight.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bow-notes">Notas</Label>
              <Textarea
                id="bow-notes"
                placeholder="Configuraciones, marca, etc."
                rows={2}
                {...register('notes')}
              />
            </div>

            <Separator />

            {/* Scope marks */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Miras</p>

              {allMarks.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="flex-1 rounded-md bg-muted px-2 py-1 text-xs">
                    {m.distance}m → {m.mark_value}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      isEdit
                        ? handleDeleteMark(m.id)
                        : setPendingMarks((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    disabled={marksPending}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    aria-label="Eliminar mira"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add mark row */}
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="m"
                  value={newDistance}
                  onChange={(e) => setNewDistance(e.target.value)}
                  className="w-20"
                  min="1"
                  aria-label="Distancia"
                />
                <Input
                  placeholder="Valor"
                  value={newMarkValue}
                  onChange={(e) => setNewMarkValue(e.target.value)}
                  className="flex-1"
                  aria-label="Valor de mira"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMark()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  onClick={handleAddMark}
                  disabled={marksPending}
                  aria-label="Agregar mira"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar arco'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
