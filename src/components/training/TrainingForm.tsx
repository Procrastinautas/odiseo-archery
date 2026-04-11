"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  deleteTrainingSession,
  upsertTrainingSession,
} from "@/actions/training";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
type Bow = Database["public"]["Tables"]["bows"]["Row"];
type Arrow = Database["public"]["Tables"]["arrows"]["Row"];

type FormValues = {
  type: TrainingSession["type"];
  weather: TrainingSession["weather"];
  distance: string;
  bow_id: string;
  arrow_id: string;
  target_size: string;
  physical_status: string;
  new_gear_notes: string;
  final_thoughts: string;
  start_time: string;
  end_time: string;
};

interface Props {
  session: TrainingSession;
  bows: Bow[];
  arrows: Arrow[];
}

export function TrainingForm({ session, bows, arrows }: Props) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, getValues, setValue } = useForm<FormValues>({
    defaultValues: {
      type: session.type ?? undefined,
      weather: session.weather ?? undefined,
      distance: session.distance?.toString() ?? "",
      bow_id: session.bow_id ?? "",
      arrow_id: session.arrow_id ?? "",
      target_size: session.target_size ?? "",
      physical_status: session.physical_status ?? "",
      new_gear_notes: session.new_gear_notes ?? "",
      final_thoughts: session.final_thoughts ?? "",
      start_time: session.start_time
        ? new Date(session.start_time).toISOString().slice(0, 16)
        : "",
      end_time: session.end_time
        ? new Date(session.end_time).toISOString().slice(0, 16)
        : "",
    },
  });

  async function handleSave() {
    const values = getValues();
    const distance = parseFloat(values.distance);
    startSaveTransition(async () => {
      const result = await upsertTrainingSession(session.id, {
        type: values.type ?? null,
        weather: values.weather ?? null,
        distance: isNaN(distance) ? null : distance,
        bow_id: values.bow_id || null,
        arrow_id: values.arrow_id || null,
        target_size: values.target_size || null,
        physical_status: values.physical_status || null,
        new_gear_notes: values.new_gear_notes || null,
        final_thoughts: values.final_thoughts || null,
        start_time: values.start_time || null,
        end_time: values.end_time || null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  }

  async function handleDeleteSession() {
    setIsDeleting(true);
    const result = await deleteTrainingSession(session.id);
    if (result.error) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Sesión eliminada");
    router.push("/training");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end items-center gap-3">
        <Button
          size="sm"
          variant="delete"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isSaving || isDeleting}
        >
          Eliminar sesión
        </Button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isSaving && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Guardando…</span>
            </>
          )}
          {isSaved && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Guardado</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || isDeleting}
        >
          Guardar
        </Button>
      </div>

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

      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select
              defaultValue={session.type ?? undefined}
              onValueChange={(v) => {
                setValue("type", v as unknown as FormValues["type"]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="control">Control</SelectItem>
                <SelectItem value="training">Entrenamiento</SelectItem>
                <SelectItem value="contest">Competencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clima */}
          <div className="flex flex-col gap-1.5">
            <Label>Clima</Label>
            <Select
              defaultValue={session.weather ?? undefined}
              onValueChange={(v) => {
                setValue("weather", v as unknown as FormValues["weather"]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el clima" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunny">Soleado</SelectItem>
                <SelectItem value="cloudy">Nublado</SelectItem>
                <SelectItem value="rainy">Lluvioso</SelectItem>
                <SelectItem value="heavy_rain">Lluvia fuerte</SelectItem>
                <SelectItem value="windy">Ventoso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Distancia */}
          <div className="flex flex-col gap-1.5">
            <Label>Distancia (metros)</Label>
            <Input
              type="number"
              min={1}
              placeholder="Ej. 18"
              {...register("distance")}
            />
          </div>

          {/* Arco */}
          <div className="flex flex-col gap-1.5">
            <Label>Arco</Label>
            <Select
              defaultValue={session.bow_id ?? undefined}
              onValueChange={(v) => setValue("bow_id", String(v)) as void}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un arco" />
              </SelectTrigger>
              <SelectContent>
                {bows.map((bow) => (
                  <SelectItem key={bow.id} value={bow.id}>
                    {bow.type === "recurve"
                      ? "Recurvo"
                      : bow.type === "compound"
                        ? "Compound"
                        : "Barebow"}
                    {" — "}
                    {bow.hand === "left" ? "Izq" : "Der"} · {bow.draw_weight}{" "}
                    lbs
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Flechas */}
          <div className="flex flex-col gap-1.5">
            <Label>Flechas</Label>
            <Select
              defaultValue={session.arrow_id ?? undefined}
              onValueChange={(v) => setValue("arrow_id", String(v)) as void}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona flechas" />
              </SelectTrigger>
              <SelectContent>
                {arrows.map((arrow) => (
                  <SelectItem key={arrow.id} value={arrow.id}>
                    {arrow.brand}
                    {arrow.diameter_mm ? ` · ${arrow.diameter_mm}mm` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tamaño de blanco */}
          <div className="flex flex-col gap-1.5">
            <Label>Tamaño de blanco</Label>
            <Input
              placeholder="Ej. 40cm, 60cm, 122cm"
              {...register("target_size")}
            />
          </div>

          {/* Estado físico */}
          <div className="flex flex-col gap-1.5">
            <Label>Estado físico</Label>
            <Textarea
              placeholder="¿Cómo te sientes hoy?"
              rows={2}
              {...register("physical_status")}
            />
          </div>

          {/* Equipo nuevo */}
          <div className="flex flex-col gap-1.5">
            <Label>Equipo nuevo</Label>
            <Textarea
              placeholder="Algo nuevo en tu equipo hoy?"
              rows={2}
              {...register("new_gear_notes")}
            />
          </div>

          {/* Hora de inicio */}
          <div className={cn("grid gap-4", "grid-cols-2")}>
            <div className="flex flex-col gap-1.5">
              <Label>Hora inicio</Label>
              <Input type="datetime-local" {...register("start_time")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hora fin</Label>
              <Input type="datetime-local" {...register("end_time")} />
            </div>
          </div>

          {/* Reflexión final */}
          <div className="flex flex-col gap-1.5">
            <Label>Reflexión final</Label>
            <Textarea
              placeholder="Pensamientos finales sobre la sesión..."
              rows={3}
              {...register("final_thoughts")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
