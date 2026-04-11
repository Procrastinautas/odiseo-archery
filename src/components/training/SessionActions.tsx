"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createRound,
  deleteTrainingSession,
  finalizeTrainingSession,
} from "@/actions/training";
import { Button, AddButton, DeleteButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FlagOff } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trainingSessionId: string;
  isFinalized: boolean;
}

export function SessionActions({ trainingSessionId, isFinalized }: Props) {
  const router = useRouter();
  const [isAddingRound, startAddRoundTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();

  const isBusy = isAddingRound || isFinalizing || isDeleting;

  function handleAddRound() {
    startAddRoundTransition(async () => {
      const result = await createRound(trainingSessionId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.id) {
        router.push(`/training/${trainingSessionId}/round/${result.id}`);
      }
    });
  }

  function handleFinalize() {
    startFinalizeTransition(async () => {
      const finalizeResult = await finalizeTrainingSession(trainingSessionId);
      if (finalizeResult.error) {
        toast.error(finalizeResult.error);
        return;
      }

      toast.success("Sesión finalizada");
      router.push(`/training/${trainingSessionId}/summary`);
    });
  }


  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:static sm:rounded-lg sm:border sm:px-2 sm:py-2 sm:shadow-sm">
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
            {isFinalizing ? "Finalizando sesión..." : "Finalizar sesión"}
          </Button>
        ) : null}
      </div>

    </>
  );
}
