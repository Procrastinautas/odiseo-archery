"use client";

import { useState, useTransition } from "react";
import { getTrainingAdvice } from "@/actions/ai";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdviceDisplayText,
  parseCoachingPayload,
  type AAAdviceItem,
} from "@/lib/ai-json";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  trainingSessionId: string;
  initialAdvice: string | null;
}

export function AIAdviceBanner({ trainingSessionId, initialAdvice }: Props) {
  const initialPayload = parseCoachingPayload(initialAdvice);
  const [advice, setAdvice] = useState<string | null>(
    getAdviceDisplayText(initialAdvice),
  );
  const [adviceList, setAdviceList] = useState<AAAdviceItem[]>(
    initialPayload?.aa_advice_list ?? [],
  );
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      const result = await getTrainingAdvice(trainingSessionId);
      if (result.advice) setAdvice(result.advice);
      if (result.payload?.aa_advice_list) {
        setAdviceList(result.payload.aa_advice_list);
      }
    });
  }

  function priorityClasses(priority: AAAdviceItem["priority"]) {
    if (priority === "alta") return "bg-red-500/15 text-red-700";
    if (priority === "media") return "bg-amber-500/15 text-amber-700";
    return "bg-emerald-500/15 text-emerald-700";
  }

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3 flex gap-3 items-start">
      <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          Consejo de IA
        </p>
        {isPending ? (
          <p className="text-sm">Obteniendo consejo...</p>
        ) : advice ? (
          <div className="text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
              }}
            >
              {advice}
            </ReactMarkdown>
          </div>
        ) : (
          <p className={cn("text-sm text-muted-foreground italic")}>
            Sin consejo todavía. Presiona actualizar.
          </p>
        )}

        {adviceList.length > 0 && (
          <div className="mt-3 space-y-2">
            {adviceList.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-md bg-background/80 p-2"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold leading-tight">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.title}
                    </ReactMarkdown>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      priorityClasses(item.priority),
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="text-xs leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.action}
                  </ReactMarkdown>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.why}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        )}
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
