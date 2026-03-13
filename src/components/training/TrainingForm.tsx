"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { upsertTrainingSession } from "@/actions/training";
import { AIAdviceBanner } from "@/components/training/AIAdviceBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const { register, watch, setValue } = useForm<FormValues>({
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

  const watchedValues = watch();
  const [debouncedValues] = useDebounce(watchedValues, 1500);

  useEffect(() => {
    const distance = parseFloat(debouncedValues.distance);
    upsertTrainingSession(session.id, {
      type: debouncedValues.type ?? null,
      weather: debouncedValues.weather ?? null,
      distance: isNaN(distance) ? null : distance,
      bow_id: debouncedValues.bow_id || null,
      arrow_id: debouncedValues.arrow_id || null,
      target_size: debouncedValues.target_size || null,
      physical_status: debouncedValues.physical_status || null,
      new_gear_notes: debouncedValues.new_gear_notes || null,
      final_thoughts: debouncedValues.final_thoughts || null,
      start_time: debouncedValues.start_time || null,
      end_time: debouncedValues.end_time || null,
    }).then(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
    setSaveStatus("saving");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValues]);

  return (
    <div className="flex flex-col gap-4">
      <AIAdviceBanner
        trainingSessionId={session.id}
        initialAdvice={session.ai_advice}
      />

      {/* Auto-save indicator */}
      <div className="flex justify-end items-center gap-1.5 text-xs text-muted-foreground min-h-[1.25rem]">
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Guardando…</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Guardado</span>
          </>
        )}
      </div>

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
