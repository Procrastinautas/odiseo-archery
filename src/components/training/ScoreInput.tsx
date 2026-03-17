"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScoreMethod = "manual";

export interface ManualData {
  arrows: (number | "X" | "M")[];
}

export interface ScoreResult {
  method: ScoreMethod;
  data: ManualData;
  total_score: number;
  tens: number;
  xs: number;
  nines: number;
  below_8_count: number;
  misses: number;
}

interface Props {
  initialData?: ManualData | null;
  onChange: (result: ScoreResult) => void;
}

const ARROW_COUNT = 6;

type ArrowValue = number | "X" | "M";
type KeyValue = ArrowValue | "DEL";

// Rows 1-3 of the keyboard grid (4 cols each); DEL gets its own full-width row
const KEYBOARD_ROWS: ArrowValue[][] = [
  ["X", 10, 9, 8],
  [7, 6, 5, 4],
  [3, 2, 1, "M"],
];

function computeManual(
  arrows: ArrowValue[],
): Omit<ScoreResult, "method" | "data"> {
  let total = 0,
    tens = 0,
    xs = 0,
    nines = 0,
    below_8 = 0,
    misses = 0;
  for (const a of arrows) {
    if (a === "X") {
      total += 10;
      xs++;
      tens++;
    } else if (a === "M") {
      misses++;
    } else {
      total += a;
      if (a === 10) tens++;
      else if (a === 9) nines++;
      else if (a <= 8) below_8++;
    }
  }
  return {
    total_score: total,
    tens,
    xs,
    nines,
    below_8_count: below_8,
    misses,
  };
}

function slotColorClass(val: ArrowValue | null): string {
  if (val === null) return "text-muted-foreground/40";
  if (val === "X" || val === 10) return "text-yellow-500 font-bold";
  if (val === 9 || val === 8) return "text-rose-500 font-semibold";
  if (val === 7 || val === 6) return "text-blue-500 font-semibold";
  if (val === 5 || val === 4)
    return "text-zinc-600 dark:text-zinc-300 font-medium";
  if (val === "M") return "text-muted-foreground italic";
  return "text-zinc-400 dark:text-zinc-500 font-medium"; // 1, 2, 3
}

function keyColorClass(val: KeyValue): string {
  if (val === "DEL")
    return "bg-muted text-muted-foreground hover:bg-muted/70 border border-border";
  if (val === "X" || val === 10)
    return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50";
  if (val === 9 || val === 8)
    return "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50";
  if (val === 7 || val === 6)
    return "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50";
  if (val === 5 || val === 4)
    return "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600";
  if (val === "M")
    return "bg-muted text-muted-foreground hover:bg-muted/70 border border-border";
  // 1, 2, 3
  return "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700";
}

// ─── Manual Input ─────────────────────────────────────────────────────────────

function ManualInput({
  initialArrows,
  onChange,
}: {
  initialArrows?: ArrowValue[];
  onChange: (r: ScoreResult) => void;
}) {
  const init: (ArrowValue | null)[] = Array.from(
    { length: ARROW_COUNT },
    (_, i) => initialArrows?.[i] ?? null,
  );

  const [arrows, setArrows] = useState<(ArrowValue | null)[]>(init);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // If opened with existing data, fire onChange immediately so Save is enabled
  useEffect(() => {
    const valid = init.filter((v): v is ArrowValue => v !== null);
    if (valid.length > 0) {
      onChange({
        method: "manual",
        data: { arrows: valid },
        ...computeManual(valid),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fireOnChange(next: (ArrowValue | null)[]) {
    const valid = next.filter((v): v is ArrowValue => v !== null);
    onChange({
      method: "manual",
      data: { arrows: valid },
      ...computeManual(valid),
    });
  }

  function handleKeyPress(val: ArrowValue) {
    const next = [...arrows];
    next[focusedIndex] = val;
    setArrows(next);
    fireOnChange(next);
    if (focusedIndex < ARROW_COUNT - 1) {
      setFocusedIndex(focusedIndex + 1);
    }
  }

  function handleDelete() {
    const next = [...arrows];
    next[focusedIndex] = null;
    setArrows(next);
    fireOnChange(next);
  }

  const validArrows = arrows.filter((v): v is ArrowValue => v !== null);
  const { total_score } = computeManual(validArrows);

  return (
    <div className="flex flex-col gap-4">
      {/* Arrow slots */}
      <div className="grid grid-cols-6 gap-2">
        {arrows.map((val, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setFocusedIndex(i)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 h-14 gap-0.5 transition-colors select-none",
              focusedIndex === i
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/40 hover:border-primary/40",
            )}
          >
            <span className="text-[10px] text-muted-foreground leading-none">
              {i + 1}
            </span>
            <span className={cn("text-lg leading-none", slotColorClass(val))}>
              {val === null ? "—" : String(val)}
            </span>
          </button>
        ))}
      </div>

      {/* Score summary */}
      <div className="flex justify-between items-center rounded-md bg-muted px-4 py-2 text-sm">
        <span className="text-muted-foreground">
          {validArrows.length} flecha{validArrows.length !== 1 ? "s" : ""}
        </span>
        <span className="font-bold text-base">{total_score} pts</span>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={focusedIndex === 0}
          onClick={() => setFocusedIndex(focusedIndex - 1)}
        >
          ← Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={focusedIndex === ARROW_COUNT - 1}
          onClick={() => setFocusedIndex(focusedIndex + 1)}
        >
          Siguiente →
        </Button>
      </div>

      {/* Custom keyboard */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-2">
          {KEYBOARD_ROWS.flat().map((key) => (
            <button
              key={String(key)}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={cn(
                "h-12 rounded-lg text-sm font-semibold transition-colors active:scale-95",
                keyColorClass(key),
              )}
            >
              {String(key)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            "w-full h-12 rounded-lg text-sm font-semibold transition-colors active:scale-95",
            keyColorClass("DEL"),
          )}
        >
          ⌫ Borrar
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScoreInput({ initialData, onChange }: Props) {
  return (
    <ManualInput
      initialArrows={(initialData as ManualData | undefined)?.arrows}
      onChange={onChange}
    />
  );
}
