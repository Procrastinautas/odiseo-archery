"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importTrainingSessionsFromClipboard } from "@/actions/training";
import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Ellipsis, Import, Plus } from "lucide-react";
import { toast } from "sonner";

type ImportResult = {
  importedCount: number;
  totalRows: number;
  failed: Array<{ rowNumber: number; reason: string }>;
};

const PLACEHOLDER = `Fecha\tHora\tDistancia\t# Flechas\tComentarios\n21 febrero 2026\t10:00 - 11:20\t18mts\t48\tLlevar el codo más atrás.`;

export function TrainingHeaderActions() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const hasText = rawText.trim().length > 0;

  const importedLabel = useMemo(() => {
    if (!result) return null;
    return `${result.importedCount} de ${result.totalRows} filas importadas`;
  }, [result]);

  function resetDialogState() {
    setResult(null);
    setRawText("");
  }

  function handleImport() {
    if (!hasText) return;

    startTransition(async () => {
      const response = await importTrainingSessionsFromClipboard(rawText);
      if (response.error) {
        setResult({
          importedCount: response.importedCount ?? 0,
          totalRows: response.totalRows ?? 0,
          failed: response.failed ?? [],
        });
        toast.error(response.error);
        return;
      }

      const importResult: ImportResult = {
        importedCount: response.importedCount,
        totalRows: response.totalRows,
        failed: response.failed,
      };

      setResult(importResult);
      setRawText("");
      router.refresh();

      if (importResult.importedCount > 0) {
        toast.success(
          `Se importaron ${importResult.importedCount} entrenamiento${
            importResult.importedCount === 1 ? "" : "s"
          }`,
        );
      }

      if (importResult.failed.length > 0) {
        toast.error(
          `${importResult.failed.length} fila${
            importResult.failed.length === 1 ? "" : "s"
          } no se pudieron importar`,
        );
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Ellipsis className="h-4 w-4" />
          Acciones
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuItem onClick={() => router.push("/training/new")}>
            <Plus className="h-4 w-4" />
            Nuevo
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            <Import className="h-4 w-4" />
            Importar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open && !isPending) resetDialogState();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar entrenamientos</DialogTitle>
            <DialogDescription>
              Pega filas copiadas de una hoja de cálculo. Se crearán sesiones en
              lote y las flechas se dividirán en rondas de 6 automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Formato esperado: Fecha, Hora, Distancia, # Flechas y Comentarios.
            </p>
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-56"
              disabled={isPending}
            />
          </div>

          {result && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{importedLabel}</p>
              {result.failed.length > 0 && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {result.failed.slice(0, 8).map((failure) => (
                    <p key={`${failure.rowNumber}-${failure.reason}`}>
                      Fila {failure.rowNumber}: {failure.reason}
                    </p>
                  ))}
                  {result.failed.length > 8 && (
                    <p>... y {result.failed.length - 8} error(es) más.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetDialogState();
              }}
              disabled={isPending}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={isPending || !hasText}
            >
              {isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
