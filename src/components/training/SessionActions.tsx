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
}

export function SessionActions({ trainingSessionId }: Props) {
  const router = useRouter();
  const [isAddingRound, startAddRoundTransition] = useTransition();
  const [isFinalizing, startFinalizeTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDeleteSession() {
    setIsDeleting(true);
    const result = await deleteTrainingSession(trainingSessionId);
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Sesión eliminada");
    router.push("/training");
  }

  return (
    <div className="flex flex-col gap-2">
      <AddButton
        type="button"
        onClick={handleAddRound}
        disabled={isBusy}
        className="w-full"
      >
        {isAddingRound ? "Creando ronda..." : "Agregar ronda"}
      </AddButton>
      <Button
        type="button"
        onClick={handleFinalize}
        disabled={isBusy}
        className="w-full"
      >
        <FlagOff className="h-4 w-4 mr-2" />
        {isFinalizing ? "Finalizando sesión..." : "Finalizar sesión"}
      </Button>
      <DeleteButton
        type="button"
        onClick={() => setIsDeleteDialogOpen(true)}
        disabled={isBusy}
        className="w-full"
      >
        Eliminar sesión
      </DeleteButton>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sesión</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la sesión completa junto con sus rondas y no
              se puede deshacer.
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
              onClick={handleDeleteSession}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar sesión"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
