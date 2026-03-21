"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRound, upsertRoundScore } from "@/actions/training";
import { ScoreInput } from "@/components/training/ScoreInput";
import type {
  ScoreMethod,
  ScoreResult,
} from "@/components/training/ScoreInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Database, Json } from "@/types/database";

type RoundScore = Database["public"]["Tables"]["round_scores"]["Row"];

interface Props {
  roundId: string;
  roundNumber: number;
  trainingSessionId: string;
  existingScore: RoundScore | null;
}

export function RoundForm({
  roundId,
  roundNumber,
  trainingSessionId,
  existingScore,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialMode: ScoreMethod =
    existingScore?.method === "summary" ? "summary" : "manual";
  const [mode, setMode] = useState<ScoreMethod>(initialMode);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleModeChange(nextMode: ScoreMethod) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setResult(null);
  }

  function handleSubmit() {
    if (!result) return;
    setError(null);
    startTransition(async () => {
      const res = await upsertRoundScore(roundId, {
        method: result.method,
        data: result.data as unknown as Json,
        total_score: result.total_score,
        tens: result.tens,
        xs: result.xs,
        nines: result.nines,
        below_8_count: result.below_8_count,
        misses: result.misses,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/training/${trainingSessionId}`);
    });
  }

  async function handleDeleteRound() {
    setIsDeleting(true);
    const res = await deleteRound(roundId);
    if (res.error) {
      toast.error(res.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Ronda eliminada");
    router.push(`/training/${trainingSessionId}`);
  }

  const initialData = existingScore ? existingScore.data : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground">
        {mode === "manual"
          ? `Ingresa el puntaje para la ronda ${roundNumber}`
          : `Ingresa la cantidad de flechas para la ronda ${roundNumber}`}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleModeChange("manual")}
          className={cn(mode === "manual" && "border-primary bg-primary/10")}
          disabled={isPending || isDeleting}
        >
          Manual
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleModeChange("summary")}
          className={cn(mode === "summary" && "border-primary bg-primary/10")}
          disabled={isPending || isDeleting}
        >
          Solo flechas
        </Button>
      </div>

      <ScoreInput
        mode={mode}
        initialData={
          existingScore?.method === mode
            ? (initialData as Parameters<typeof ScoreInput>[0]["initialData"])
            : null
        }
        onChange={setResult}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}
      <hr />
      <div className="flex gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/training/${trainingSessionId}`)}
          disabled={isPending || isDeleting}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={handleSubmit}
          disabled={isPending || isDeleting || !result}
        >
          {isPending ? "Guardando..." : "Guardar ronda"}
        </Button>
      </div>
      <Button
        type="button"
        variant="delete"
        className="w-full"
        onClick={() => setIsDeleteDialogOpen(true)}
        disabled={isPending || isDeleting}
      >
        Eliminar ronda
      </Button>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar ronda</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la ronda{" "}
              {roundNumber}y su puntaje.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="delete"
              onClick={handleDeleteRound}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar ronda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
