"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createRound, finalizeTrainingSession } from "@/actions/training";
import { getSessionRecap } from "@/actions/ai";
import { Button, AddButton } from "@/components/ui/button";
import { FlagOff } from "lucide-react";

interface Props {
  trainingSessionId: string;
}

export function SessionActions({ trainingSessionId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAddRound() {
    startTransition(async () => {
      const result = await createRound(trainingSessionId);
      if (result.id) {
        router.push(`/training/${trainingSessionId}/round/${result.id}`);
      }
    });
  }

  function handleFinalize() {
    startTransition(async () => {
      await finalizeTrainingSession(trainingSessionId);
      await getSessionRecap(trainingSessionId);
      router.push(`/training/${trainingSessionId}/summary`);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <AddButton
        type="button"
        onClick={handleAddRound}
        disabled={isPending}
        className="w-full"
      >
        Agregar ronda
      </AddButton>
      <Button
        type="button"
        onClick={handleFinalize}
        disabled={isPending}
        className="w-full"
      >
        <FlagOff className="h-4 w-4 mr-2" />
        {isPending ? "Finalizando..." : "Finalizar sesión"}
      </Button>
    </div>
  );
}
