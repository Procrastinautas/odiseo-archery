"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, AddButton, DeleteButton } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowSheet } from "./ArrowSheet";
import { deleteArrow } from "@/actions/profile";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { Database } from "@/types/database";

type Arrow = Database["public"]["Tables"]["arrows"]["Row"];

interface ArrowsSectionProps {
  initialArrows: Arrow[];
}

export function ArrowsSection({ initialArrows }: ArrowsSectionProps) {
  const [arrows, setArrows] = useState<Arrow[]>(initialArrows);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingArrow, setEditingArrow] = useState<Arrow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() {
    setEditingArrow(null);
    setSheetOpen(true);
  }

  function openEdit(arrow: Arrow) {
    setEditingArrow(arrow);
    setSheetOpen(true);
  }

  function handleSaved(saved: Arrow) {
    setArrows((prev) => {
      const exists = prev.find((a) => a.id === saved.id);
      if (exists) return prev.map((a) => (a.id === saved.id ? saved : a));
      return [...prev, saved];
    });
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteArrow(id);
      setArrows((prev) => prev.filter((a) => a.id !== id));
      toast.success("Flecha eliminada");
    } catch {
      toast.error("Error al eliminar la flecha");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Flechas</CardTitle>
          <AddButton size="sm" onClick={openAdd}>
            Agregar
          </AddButton>
        </CardHeader>
        <CardContent className="space-y-3">
          {arrows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin flechas registradas
            </p>
          )}
          {arrows.map((arrow, i) => (
            <div key={arrow.id}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-medium text-sm">{arrow.brand}</p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      arrow.diameter_mm ? `${arrow.diameter_mm}mm` : null,
                      arrow.shaft_material,
                      arrow.fletchings,
                      arrow.point_type,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {arrow.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {arrow.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openEdit(arrow)}
                    aria-label="Editar flecha"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteButton
                    size="icon-sm"
                    onClick={() => handleDelete(arrow.id)}
                    disabled={deleting === arrow.id}
                    aria-label="Eliminar flecha"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ArrowSheet
        key={editingArrow?.id ?? "new"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        arrow={editingArrow}
        onSaved={handleSaved}
      />
    </>
  );
}
