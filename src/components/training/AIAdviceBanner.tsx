"use client";

import { useState, useTransition } from "react";
import { getTrainingAdvice } from "@/actions/ai";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  trainingSessionId: string;
  initialAdvice: string | null;
}

export function AIAdviceBanner({ trainingSessionId, initialAdvice }: Props) {
  const [advice, setAdvice] = useState<string | null>(initialAdvice);
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await getTrainingAdvice(trainingSessionId);
      if (result.advice) setAdvice(result.advice);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3 flex gap-3 items-start">
      <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Consejo de IA
        </p>
        <p className={cn("text-sm", !advice && "text-muted-foreground italic")}>
          {isPending
            ? "Obteniendo consejo..."
            : (advice ?? "Sin consejo todavía. Presiona actualizar.")}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 h-7 w-7"
        onClick={handleRefresh}
        disabled={isPending}
        aria-label="Actualizar consejo"
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
      </Button>
    </div>
  );
}
