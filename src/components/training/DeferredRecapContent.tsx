"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSessionRecap } from "@/actions/ai";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  trainingSessionId: string;
}

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

function hasSlowConnection() {
  if (typeof navigator === "undefined") return false;

  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;

  if (!connection) return false;
  if (connection.saveData) return true;

  const type = connection.effectiveType?.toLowerCase();
  return type === "slow-2g" || type === "2g";
}

export function DeferredRecapContent({ trainingSessionId }: Props) {
  const router = useRouter();
  const autoStarted = useRef(false);

  const [recap, setRecap] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSlow] = useState(() => hasSlowConnection());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isSlow || autoStarted.current) return;

    autoStarted.current = true;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await getSessionRecap(trainingSessionId);
        if (result.error) {
          setError(result.error);
          return;
        }

        setRecap(result.recap);
        toast.success("Resumen IA generado");
        router.refresh();
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isSlow, router, trainingSessionId]);

  function generateRecapNow() {
    setError(null);
    startTransition(async () => {
      const result = await getSessionRecap(trainingSessionId);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setRecap(result.recap);
      toast.success("Resumen IA generado");
      router.refresh();
    });
  }

  if (recap) {
    return (
      <div className="text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc pl-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 space-y-1">{children}</ol>
            ),
          }}
        >
          {recap}
        </ReactMarkdown>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 p-3">
        <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Generando resumen con IA...</p>
          <p className="text-xs text-muted-foreground">
            Puede tardar unos segundos dependiendo de la conexión.
          </p>
        </div>
      </div>
    );
  }

  if (isSlow) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border/60 bg-muted/40 p-3">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Resumen IA diferido</p>
            <p className="text-xs text-muted-foreground">
              Detectamos conexión lenta. Puedes generar el resumen cuando
              quieras.
            </p>
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="button" size="sm" onClick={generateRecapNow}>
          Generar resumen ahora
        </Button>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground italic">
      Preparando resumen de IA...
    </p>
  );
}
