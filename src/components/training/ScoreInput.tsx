'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type ScoreMethod = 'manual' | 'summary'

export interface ManualData {
  arrows: (number | 'X' | 'M')[]
}

export interface SummaryData {
  tens: number
  xs: number
  nines: number
  below_8: number
  misses: number
}

export interface ScoreResult {
  method: ScoreMethod
  data: ManualData | SummaryData
  total_score: number
  tens: number
  xs: number
  nines: number
  below_8_count: number
  misses: number
}

interface Props {
  initialMethod?: ScoreMethod
  initialData?: ManualData | SummaryData | null
  onChange: (result: ScoreResult) => void
}

const ARROW_COUNT = 6

function parseArrowValue(raw: string): number | 'X' | 'M' | null {
  const v = raw.trim().toUpperCase()
  if (v === 'X') return 'X'
  if (v === 'M' || v === '0') return 'M'
  const n = parseInt(v, 10)
  if (!isNaN(n) && n >= 1 && n <= 10) return n
  return null
}

function computeManual(arrows: (number | 'X' | 'M')[]): Omit<ScoreResult, 'method' | 'data'> {
  let total = 0, tens = 0, xs = 0, nines = 0, below_8 = 0, misses = 0
  for (const a of arrows) {
    if (a === 'X') { total += 10; xs++; tens++ }
    else if (a === 'M') { misses++ }
    else {
      total += a
      if (a === 10) tens++
      else if (a === 9) nines++
      else if (a <= 8) below_8++
    }
  }
  return { total_score: total, tens, xs, nines, below_8_count: below_8, misses }
}

function computeSummary(d: SummaryData): Omit<ScoreResult, 'method' | 'data'> {
  const total = (d.xs * 10) + (d.tens * 10) + (d.nines * 9) + (d.below_8 * 7)
  return {
    total_score: total,
    tens: d.tens + d.xs,
    xs: d.xs,
    nines: d.nines,
    below_8_count: d.below_8,
    misses: d.misses,
  }
}

// ─── Manual Input ─────────────────────────────────────────────────────────────

function ManualInput({ initialArrows, onChange }: { initialArrows?: (number | 'X' | 'M')[]; onChange: (r: ScoreResult) => void }) {
  const init: string[] = Array.from({ length: ARROW_COUNT }, (_, i) => {
    const v = initialArrows?.[i]
    return v == null ? '' : v === 'X' ? 'X' : v === 'M' ? 'M' : String(v)
  })
  const [rawValues, setRawValues] = useState<string[]>(init)

  function handleChange(index: number, raw: string) {
    const next = [...rawValues]
    next[index] = raw.toUpperCase()
    setRawValues(next)

    const parsed = next.map((v) => (v === '' ? null : parseArrowValue(v))).filter((v): v is number | 'X' | 'M' => v !== null)
    const computed = computeManual(parsed)
    onChange({
      method: 'manual',
      data: { arrows: parsed } as ManualData,
      ...computed,
    })
  }

  const parsed = rawValues.map((v) => (v === '' ? null : parseArrowValue(v)))
  const validArrows = parsed.filter((v): v is number | 'X' | 'M' => v !== null)
  const { total_score } = computeManual(validArrows)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: ARROW_COUNT }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Label className="text-xs text-muted-foreground">{i + 1}</Label>
            <Input
              value={rawValues[i]}
              onChange={(e) => handleChange(i, e.target.value)}
              maxLength={2}
              placeholder="—"
              className={cn(
                'text-center h-10 font-mono text-sm uppercase px-1',
                parsed[i] === 'X' && 'text-yellow-600 font-bold',
                parsed[i] === 'M' && 'text-muted-foreground',
              )}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Valores aceptados: 1–10, <span className="font-semibold">X</span> (10 especial), <span className="font-semibold">M</span> (fallo)
      </p>
      <div className="flex justify-between items-center rounded-md bg-muted px-4 py-2 text-sm">
        <span className="text-muted-foreground">{validArrows.length} flecha{validArrows.length !== 1 ? 's' : ''}</span>
        <span className="font-bold text-base">{total_score} pts</span>
      </div>
    </div>
  )
}

// ─── Summary Input ────────────────────────────────────────────────────────────

function SummaryInput({ initialData, onChange }: { initialData?: SummaryData; onChange: (r: ScoreResult) => void }) {
  const [values, setValues] = useState<SummaryData>({
    tens: initialData?.tens ?? 0,
    xs: initialData?.xs ?? 0,
    nines: initialData?.nines ?? 0,
    below_8: initialData?.below_8 ?? 0,
    misses: initialData?.misses ?? 0,
  })

  function handleField(field: keyof SummaryData, raw: string) {
    const n = Math.max(0, parseInt(raw, 10) || 0)
    const next = { ...values, [field]: n }
    setValues(next)
    const computed = computeSummary(next)
    onChange({ method: 'summary', data: next as SummaryData, ...computed })
  }

  const { total_score } = computeSummary(values)
  const fields: { key: keyof SummaryData; label: string }[] = [
    { key: 'xs', label: 'Xs' },
    { key: 'tens', label: '10s' },
    { key: 'nines', label: '9s' },
    { key: 'below_8', label: '≤8' },
    { key: 'misses', label: 'Fallos' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Input
              type="number"
              min={0}
              value={values[key]}
              onChange={(e) => handleField(key, e.target.value)}
              className="text-center h-10 font-mono text-sm px-1"
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Puntuación estimada: X=10, 10=10, 9=9, ≤8 promedio=7
      </p>
      <div className="flex justify-between items-center rounded-md bg-muted px-4 py-2 text-sm">
        <span className="text-muted-foreground">
          {values.xs + values.tens + values.nines + values.below_8 + values.misses} flechas
        </span>
        <span className="font-bold text-base">{total_score} pts</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScoreInput({ initialMethod = 'manual', initialData, onChange }: Props) {
  const [method, setMethod] = useState<ScoreMethod>(initialMethod)

  const tabs: { value: ScoreMethod; label: string }[] = [
    { value: 'manual', label: 'Manual' },
    { value: 'summary', label: 'Resumen' },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Method tabs */}
      <div className="flex rounded-lg border overflow-hidden">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMethod(value)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              method === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Score input by method */}
      {method === 'manual' && (
        <ManualInput
          initialArrows={(initialData as ManualData | undefined)?.arrows}
          onChange={onChange}
        />
      )}
      {method === 'summary' && (
        <SummaryInput
          initialData={initialData as SummaryData | undefined}
          onChange={onChange}
        />
      )}
    </div>
  )
}
