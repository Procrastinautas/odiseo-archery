"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTransition } from "react";
import { createRound, finalizeTrainingSession } from "@/actions/training";
import { generateUUID } from "@/lib/uuid";
import { AddButton, Button } from "@/components/ui/button";
import { FlagOff } from "lucide-react";
import { toast } from "sonner";
import { getTrainingSaveToastMessage } from "@/lib/training-save-feedback";

interface Props {
  trainingSessionId: string;
  isFinalized: boolean;
  currentRoundCount: number;
}

function path(parts: string[]): string {
  return ["", ...parts].join("/");
}

export function SessionActions({
  trainingSessionId,
  isFinalized,
  currentRoundCount,
}: Props) {
  const router = useRouter();
  const [isAddingRound, startAddRoundTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [roundError, setRoundError] = useState<string | null>(null);
  const roundIdRef = useRef<string | null>(null);

  const isBusy = isAddingRound || isFinalizing;

  function handleAddRound() {
    if (!roundIdRef.current) {
      roundIdRef.current = generateUUID();
    }
    setRoundError(null);

    startAddRoundTransition(async () => {
      const roundNumber = currentRoundCount + 1;
      const result = await createRound(trainingSessionId, {
        clientId: roundIdRef.current!,
        roundNumber,
      });

      if (result.error) {
        const message = getTrainingSaveToastMessage("la ronda", result.error);
        setRoundError(result.error);
        toast.error(message);
        console.error("Error al crear la ronda", {
          trainingSessionId,
          roundId: roundIdRef.current,
          roundNumber,
          error: result.error,
        });
        return;
      }

      if (result.id) {
        roundIdRef.current = null;
        setRoundError(null);
        router.push(path(["training", trainingSessionId, "round", result.id]));
      }
    });
  }

  function handleFinalize() {
    startFinalizeTransition(async () => {
      const result = await finalizeTrainingSession(trainingSessionId);
      if (result.error) {
        const message = getTrainingSaveToastMessage("la sesión", result.error);
        toast.error(message);
        console.error("Error al finalizar la sesión", {
          trainingSessionId,
          error: result.error,
        });
        return;
      }

      toast.success("Sesion finalizada");
      router.push(path(["training", trainingSessionId, "summary"]));
    });
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-2 backdrop-blur sm:static sm:rounded-lg sm:border sm:p-2 sm:shadow-sm">
        <div className="mx-auto w-full max-w-screen-sm flex flex-col gap-2">
          <AddButton
            type="button"
            onClick={handleAddRound}
            disabled={isBusy}
            className="h-12 w-full text-[0.95rem] font-semibold"
          >
            {isAddingRound ? "Creando ronda..." : "Agregar ronda"}
          </AddButton>
          {roundError && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md flex items-center justify-between">
              <span>{roundError}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAddRound}
                disabled={isAddingRound}
                className="ml-2"
              >
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {!isFinalized ? (
          <Button
            type="button"
            onClick={handleFinalize}
            disabled={isBusy}
            className="h-11 w-full"
          >
            <FlagOff className="mr-2 h-4 w-4" />
            {isFinalizing ? "Finalizando sesion..." : "Finalizar sesion"}
          </Button>
        ) : null}
      </div>
    </>
  );
}
