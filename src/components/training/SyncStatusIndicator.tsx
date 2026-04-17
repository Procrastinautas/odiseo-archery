"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/local-db";
import { retryFailed } from "@/lib/sync-engine";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";

export function SyncStatusIndicator() {
  const params = useParams();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;

  const pendingOps = useLiveQuery(
    () =>
      db
        ?.syncQueue.where("sessionId")
        .equals(sessionId)
        .and((op: any) => op.status === "pending")
        .count(),
    [sessionId],
  );

  const failedOps = useLiveQuery(
    () =>
      db
        ?.syncQueue.where("sessionId")
        .equals(sessionId)
        .and((op: any) => op.status === "failed")
        .count(),
    [sessionId],
  );

  const handleRetry = useCallback(async () => {
    if (sessionId) {
      await retryFailed(sessionId);
    }
  }, [sessionId]);

  if (!sessionId) return null;
  if (pendingOps === 0 && failedOps === 0) return null;

  if (failedOps && failedOps > 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm flex-1">
          Error al sincronizar ({failedOps})
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRetry}
          className="h-6 px-2 text-xs"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (pendingOps && pendingOps > 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg">
        <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
        <span className="text-sm">Sincronizando ({pendingOps})</span>
      </div>
    );
  }

  return null;
}
