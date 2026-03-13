'use client'

import { useTransition } from 'react'
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
import { addArrow, updateArrow } from '@/actions/profile'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Database } from '@/types/database'

type Arrow = Database['public']['Tables']['arrows']['Row']

const arrowSchema = z.object({
  brand: z.string().min(1, 'La marca es requerida').max(100),
  // Stored as string (HTML number input); parsed to number in submit handler
  diameter_mm: z.string().optional(),
  shaft_material: z.string().max(100).optional(),
  fletchings: z.string().max(100).optional(),
  point_type: z.string().max(100).optional(),
  notes: z.string().optional(),
})
type ArrowFormValues = z.infer<typeof arrowSchema>

interface ArrowSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  arrow?: Arrow | null
  onSaved: (arrow: Arrow) => void
}

export function ArrowSheet({ open, onOpenChange, arrow, onSaved }: ArrowSheetProps) {
  const isEdit = !!arrow
  const [saving, startSave] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArrowFormValues>({
    resolver: zodResolver(arrowSchema),
    defaultValues: arrow
      ? {
          brand: arrow.brand,
          diameter_mm: arrow.diameter_mm != null ? String(arrow.diameter_mm) : '',
          shaft_material: arrow.shaft_material ?? '',
          fletchings: arrow.fletchings ?? '',
          point_type: arrow.point_type ?? '',
          notes: arrow.notes ?? '',
        }
      : {
          brand: '',
          diameter_mm: '',
          shaft_material: '',
          fletchings: '',
          point_type: '',
          notes: '',
        },
  })

  function onSubmit(values: ArrowFormValues) {
    startSave(async () => {
      try {
        const parsedDiam = values.diameter_mm ? parseFloat(values.diameter_mm) : null
        const payload = {
          brand: values.brand,
          diameter_mm: parsedDiam && !isNaN(parsedDiam) ? parsedDiam : null,
          shaft_material: values.shaft_material || null,
          fletchings: values.fletchings || null,
          point_type: values.point_type || null,
          notes: values.notes || null,
        }

        let saved: Arrow
        if (isEdit && arrow) {
          await updateArrow(arrow.id, payload)
          saved = { ...arrow, ...payload }
        } else {
          saved = await addArrow(payload)
        }

        toast.success(isEdit ? 'Flecha actualizada' : 'Flecha agregada')
        onSaved(saved)
        onOpenChange(false)
      } catch (err) {
        toast.error('Error al guardar la flecha')
        console.error(err)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar flecha' : 'Agregar flecha'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="contents">
          <div className="flex flex-col gap-4 px-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-brand">Marca *</Label>
              <Input
                id="arrow-brand"
                placeholder="Ej. Easton, Victory, Carbon Express"
                {...register('brand')}
                aria-invalid={!!errors.brand}
              />
              {errors.brand && (
                <p className="text-xs text-destructive">{errors.brand.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-diameter">Diámetro (mm)</Label>
              <Input
                id="arrow-diameter"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej. 4.2"
                {...register('diameter_mm')}
              />
              {errors.diameter_mm && (
                <p className="text-xs text-destructive">{errors.diameter_mm.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-shaft">Material del tubo</Label>
              <Input
                id="arrow-shaft"
                placeholder="Ej. Carbono, Aluminio"
                {...register('shaft_material')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-fletchings">Plumas</Label>
              <Input
                id="arrow-fletchings"
                placeholder="Ej. Vanes 2 pulgadas"
                {...register('fletchings')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-point">Tipo de punta</Label>
              <Input
                id="arrow-point"
                placeholder="Ej. 100 granos, campo"
                {...register('point_type')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="arrow-notes">Notas</Label>
              <Textarea
                id="arrow-notes"
                placeholder="Detalles adicionales…"
                rows={2}
                {...register('notes')}
              />
            </div>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar flecha'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
