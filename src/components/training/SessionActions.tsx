"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createRound, finalizeTrainingSession } from "@/actions/training";
import { AddButton, Button } from "@/components/ui/button";
import { FlagOff } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trainingSessionId: string;
  isFinalized: boolean;
}

function path(parts: string[]): string {
  return ["", ...parts].join("/");
}

export function SessionActions({ trainingSessionId, isFinalized }: Props) {
  const router = useRouter();
  const [isAddingRound, startAddRoundTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();

  const isBusy = isAddingRound || isFinalizing;

  function handleAddRound() {
    startAddRoundTransition(async () => {
      const result = await createRound(trainingSessionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.id) {
        router.push(path(["training", trainingSessionId, "round", result.id]));
      }
    });
  }

  function handleFinalize() {
    startFinalizeTransition(async () => {
      const result = await finalizeTrainingSession(trainingSessionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Sesion finalizada");
      router.push(path(["training", trainingSessionId, "summary"]));
    });
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 py-2 backdrop-blur sm:static sm:rounded-lg sm:border sm:p-2 sm:shadow-sm">
        <div className="mx-auto w-full max-w-screen-sm">
          <AddButton
            type="button"
            onClick={handleAddRound}
            disabled={isBusy}
            className="h-12 w-full text-[0.95rem] font-semibold"
          >
            {isAddingRound ? "Creando ronda..." : "Agregar ronda"}
          </AddButton>
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
