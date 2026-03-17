"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, AddButton, DeleteButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BowSheet } from "./BowSheet";
import { deleteBow } from "@/actions/profile";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import type { Database } from "@/types/database";

type Bow = Database["public"]["Tables"]["bows"]["Row"];
type ScopeMark = Database["public"]["Tables"]["scope_marks"]["Row"];

interface BowWithMarks extends Bow {
  scope_marks: ScopeMark[];
}

interface BowsSectionProps {
  initialBows: BowWithMarks[];
}

const BOW_LABELS: Record<string, string> = {
  recurve: "Recurvo",
  compound: "Compuesto",
  barebow: "Arco Desnudo",
};

export function BowsSection({ initialBows }: BowsSectionProps) {
  const [bows, setBows] = useState<BowWithMarks[]>(initialBows);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBow, setEditingBow] = useState<BowWithMarks | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function openAdd() {
    setEditingBow(null);
    setSheetOpen(true);
  }

  function openEdit(bow: BowWithMarks) {
    setEditingBow(bow);
    setSheetOpen(true);
  }

  function handleSaved(savedBow: Bow) {
    setBows((prev) => {
      const exists = prev.find((b) => b.id === savedBow.id);
      if (exists) {
        return prev.map((b) =>
          b.id === savedBow.id ? { ...b, ...savedBow } : b,
        );
      }
      return [...prev, { ...savedBow, scope_marks: [] }];
    });
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteBow(id);
      setBows((prev) => prev.filter((b) => b.id !== id));
      toast.success("Arco eliminado");
    } catch {
      toast.error("Error al eliminar el arco");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">Arcos</CardTitle>
          <AddButton size="sm" onClick={openAdd}>
            Agregar
          </AddButton>
        </CardHeader>
        <CardContent className="space-y-4">
          {bows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sin arcos registrados
            </p>
          )}
          {bows.map((bow, i) => (
            <div key={bow.id}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{BOW_LABELS[bow.type]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {bow.hand === "right" ? "Diestro" : "Zurdo"}
                    </Badge>
                    {bow.draw_weight != null && (
                      <Badge variant="outline" className="text-xs">
                        {bow.draw_weight} lb
                      </Badge>
                    )}
                  </div>
                  {bow.notes && (
                    <p className="text-sm text-muted-foreground">{bow.notes}</p>
                  )}
                  {bow.scope_marks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {bow.scope_marks.map((sm) => (
                        <span
                          key={sm.id}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs"
                        >
                          {sm.distance}m → {sm.mark_value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => openEdit(bow)}
                    aria-label="Editar arco"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <DeleteButton
                    size="icon-sm"
                    onClick={() => handleDelete(bow.id)}
                    disabled={deleting === bow.id}
                    aria-label="Eliminar arco"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <BowSheet
        key={editingBow?.id ?? "new"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        bow={editingBow}
        scopeMarks={editingBow?.scope_marks}
        onSaved={handleSaved}
      />
    </>
  );
}
