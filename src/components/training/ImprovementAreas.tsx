"use client";

import { useState, useTransition } from "react";
import { deleteImprovementArea } from "@/actions/training";
import { enqueue } from "@/lib/sync-engine";
import { db } from "@/lib/local-db";
import { generateUUID } from "@/lib/uuid";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Clock } from "lucide-react";
import type { Database } from "@/types/database";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { getTrainingSaveToastMessage } from "@/lib/training-save-feedback";

type ImprovementArea = Database["public"]["Tables"]["improvement_areas"]["Row"];

interface Props {
  trainingSessionId: string;
  initialAreas: ImprovementArea[];
}

interface LocalArea extends ImprovementArea {
  syncStatus?: "pending" | "synced";
}

export function ImprovementAreas({ trainingSessionId, initialAreas }: Props) {
  const [areas, setAreas] = useState<LocalArea[]>(initialAreas);
  const [newComment, setNewComment] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const clientId = generateUUID();
      const newArea: LocalArea = {
        id: clientId,
        training_session_id: trainingSessionId,
        comment: trimmed,
        attachment_url: null,
        created_at: new Date().toISOString(),
        syncStatus: "pending",
      };

      // Optimistically add to local state
      setAreas((prev) => [...prev, newArea]);
      setNewComment("");

      // Enqueue for background sync
      await enqueue({
        type: "CREATE_IMPROVEMENT_AREA",
        opId: clientId,
        payload: {
          trainingSessionId,
          comment: trimmed,
          clientId,
        },
        sessionId: trainingSessionId,
      });

      toast.success("Área agregada");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      // Check if this is a pending area (hasn't synced yet)
      const area = areas.find((a) => a.id === id);
      const isPendingArea = area?.syncStatus === "pending";

      if (isPendingArea) {
        // Remove from local state and cancel sync
        setAreas((prev) => prev.filter((a) => a.id !== id));
        if (db) {
          await db.syncQueue.where("opId").equals(id).delete();
        }
        toast.success("Área removida");
        return;
      }

      // For synced areas, delete from server
      const result = await deleteImprovementArea(id);
      if (result.error) {
        const message = getTrainingSaveToastMessage(
          "el área a mejorar",
          result.error,
        );
        toast.error(message);
        console.error("Error al eliminar un área a mejorar", {
          trainingSessionId,
          areaId: id,
          error: result.error,
        });
        return;
      }
      setAreas((prev) => prev.filter((a) => a.id !== id));
      toast.success("Área eliminada");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Áreas a mejorar</p>
      {areas.map((area) => (
        <div
          key={area.id}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
            area.syncStatus === "pending" ? "opacity-60" : ""
          }`}
        >
          <span className="flex-1 text-sm">{area.comment}</span>
          {area.syncStatus === "pending" && (
            <Clock className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          )}
          <button
            type="button"
            onClick={() => handleDelete(area.id)}
            disabled={isPending}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Agregar área a mejorar..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isPending || !newComment.trim()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
