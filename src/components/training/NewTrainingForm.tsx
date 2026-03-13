'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { createTrainingSession } from '@/actions/training'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Database } from '@/types/database'

type Bow = Database['public']['Tables']['bows']['Row']
type Arrow = Database['public']['Tables']['arrows']['Row']

const schema = z.object({
  type: z.enum(['control', 'training', 'contest']),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'heavy_rain', 'windy']),
  distance: z.string().min(1, 'Ingresa la distancia'),
  bow_id: z.string().nullish(),
  arrow_id: z.string().nullish(),
  target_size: z.string().nullish(),
  physical_status: z.string().nullish(),
  new_gear_notes: z.string().nullish(),
  start_time: z.string().nullish(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  bows: Bow[]
  arrows: Arrow[]
}

export function NewTrainingForm({ bows, arrows }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_time: new Date().toISOString().slice(0, 16),
    },
  })

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    setServerError(null)
    const distance = parseFloat(values.distance)
    if (isNaN(distance) || distance < 1) {
      setServerError('Ingresa una distancia válida')
      setSubmitting(false)
      return
    }
    const result = await createTrainingSession({ ...values, distance })
    if (result.error) {
      setServerError(result.error)
      setSubmitting(false)
      return
    }
    router.push(`/training/${result.id}`)
  }

  return (
    <div className="flex flex-col">
      <PageHeader title="Nueva sesión" />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-4">
            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select onValueChange={(v) => setValue('type', (v as unknown) as FormValues['type'])} defaultValue={undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="control">Control</SelectItem>
                  <SelectItem value="training">Entrenamiento</SelectItem>
                  <SelectItem value="contest">Competencia</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
            </div>

            {/* Clima */}
            <div className="flex flex-col gap-1.5">
              <Label>Clima</Label>
              <Select onValueChange={(v) => setValue('weather', (v as unknown) as FormValues['weather'])} defaultValue={undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el clima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Soleado</SelectItem>
                  <SelectItem value="cloudy">Nublado</SelectItem>
                  <SelectItem value="rainy">Lluvioso</SelectItem>
                  <SelectItem value="heavy_rain">Lluvia fuerte</SelectItem>
                  <SelectItem value="windy">Ventoso</SelectItem>
                </SelectContent>
              </Select>
              {errors.weather && <p className="text-destructive text-xs">{errors.weather.message}</p>}
            </div>

            {/* Distancia */}
            <div className="flex flex-col gap-1.5">
              <Label>Distancia (metros)</Label>
              <Input type="number" min={1} placeholder="Ej. 18" {...register('distance')} />
              {errors.distance && <p className="text-destructive text-xs">{errors.distance.message}</p>}
            </div>

            {/* Arco */}
            <div className="flex flex-col gap-1.5">
              <Label>Arco</Label>
              <Select onValueChange={(v) => setValue('bow_id', String(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un arco" />
                </SelectTrigger>
                <SelectContent>
                  {bows.map((bow) => (
                    <SelectItem key={bow.id} value={bow.id}>
                      {bow.type === 'recurve' ? 'Recurvo' : bow.type === 'compound' ? 'Compound' : 'Barebow'}{' — '}
                      {bow.hand === 'left' ? 'Izq' : 'Der'} · {bow.draw_weight} lbs
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Flechas */}
            <div className="flex flex-col gap-1.5">
              <Label>Flechas</Label>
              <Select onValueChange={(v) => setValue('arrow_id', String(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona flechas" />
                </SelectTrigger>
                <SelectContent>
                  {arrows.map((arrow) => (
                    <SelectItem key={arrow.id} value={arrow.id}>
                      {arrow.brand}
                      {arrow.diameter_mm ? ` · ${arrow.diameter_mm}mm` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tamaño de blanco */}
            <div className="flex flex-col gap-1.5">
              <Label>Tamaño de blanco</Label>
              <Input placeholder="Ej. 40cm, 60cm, 122cm" {...register('target_size')} />
            </div>

            {/* Estado físico */}
            <div className="flex flex-col gap-1.5">
              <Label>Estado físico</Label>
              <Textarea placeholder="¿Cómo te sientes hoy?" rows={2} {...register('physical_status')} />
            </div>

            {/* Equipo nuevo */}
            <div className="flex flex-col gap-1.5">
              <Label>Equipo nuevo</Label>
              <Textarea placeholder="Algo nuevo en tu equipo hoy?" rows={2} {...register('new_gear_notes')} />
            </div>

            {/* Hora de inicio */}
            <div className="flex flex-col gap-1.5">
              <Label>Hora de inicio</Label>
              <Input type="datetime-local" {...register('start_time')} />
            </div>
          </CardContent>
        </Card>

        {serverError && <p className="text-destructive text-sm text-center">{serverError}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Iniciando...' : 'Iniciar sesión'}
        </Button>
      </form>
    </div>
  )
}
