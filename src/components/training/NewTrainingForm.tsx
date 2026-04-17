"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useTransition, useRef, useEffect } from "react";
import { createTrainingSession } from "@/actions/training";
import type { TrainingStartRecapCard } from "@/actions/training";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { TrainingStartRecapCards } from "@/components/training/TrainingStartRecapCards";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { Database } from "@/types/database";
import { toast } from "sonner";
import { getTrainingSaveToastMessage } from "@/lib/training-save-feedback";
import {
  getCurrentDatetimeLocalValue,
  parseDatetimeLocalValueToUtcIso,
} from "@/lib/datetime";
import { generateUUID } from "@/lib/uuid";

type Bow = Database["public"]["Tables"]["bows"]["Row"];
type Arrow = Database["public"]["Tables"]["arrows"]["Row"];

const schema = z.object({
  type: z.enum(["control", "training", "contest"]),
  weather: z.enum(["sunny", "cloudy", "rainy", "heavy_rain", "windy"]),
  distance: z.string().min(1, "Ingresa la distancia"),
  bow_id: z.string().nullish(),
  arrow_id: z.string().nullish(),
  target_size: z.string().nullish(),
  physical_status: z.string().nullish(),
  new_gear_notes: z.string().nullish(),
  start_time: z.string().nullish(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  bows: Bow[];
  arrows: Arrow[];
  recapCards: TrainingStartRecapCard[];
}

export function NewTrainingForm({ bows, arrows, recapCards }: Props) {
  const router = useRouter();
  const [isRecapGateOpen, setIsRecapGateOpen] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateUUID();
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_time: getCurrentDatetimeLocalValue(),
    },
  });

  async function goToStep2() {
    const valid = await trigger(["type", "weather", "distance"]);
    if (valid) setStep(2);
  }

  function onSubmit(values: FormValues) {
    setServerError(null);
    const distance = parseFloat(values.distance);
    if (isNaN(distance) || distance < 1) {
      setServerError("Ingresa una distancia válida");
      return;
    }

    startTransition(async () => {
      const result = await createTrainingSession({
        id: sessionIdRef.current || undefined,
        ...values,
        distance,
        start_time: parseDatetimeLocalValueToUtcIso(values.start_time),
      });
      if (result.error) {
        const message = getTrainingSaveToastMessage("la sesión", result.error);
        setServerError(message);
        toast.error(message);
        console.error("Error al crear la sesión", {
          sessionId: sessionIdRef.current,
          error: result.error,
        });
        return;
      }

      toast.success("Sesión creada");
      router.push(`/training/${result.id}`);
    });
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title={
          isRecapGateOpen
            ? "Recap antes de iniciar"
            : step === 1
              ? "Nueva sesión"
              : "Detalles opcionales"
        }
        backHref={isRecapGateOpen || step === 1 ? "/training" : undefined}
      />
      {isRecapGateOpen ? (
        <div className="p-4 pb-28 sm:pb-6">
          <TrainingStartRecapCards
            recapCards={recapCards}
            onContinue={() => setIsRecapGateOpen(false)}
          />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4"
        >
          {/* ── Step 1: required fields ── */}
          {step === 1 && (
            <>
              <Card>
                <CardContent className="flex flex-col gap-4 pt-4">
                  {/* Tipo */}
                  <div className="flex flex-col gap-1.5">
                    <Label>Tipo</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue("type", v as unknown as FormValues["type"])
                      }
                      defaultValue={undefined}
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
                    {errors.type && (
                      <p className="text-destructive text-xs">
                        {errors.type.message}
                      </p>
                    )}
                  </div>

                  {/* Clima */}
                  <div className="flex flex-col gap-1.5">
                    <Label>Clima</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue(
                          "weather",
                          v as unknown as FormValues["weather"],
                        )
                      }
                      defaultValue={undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el clima" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sunny">Soleado</SelectItem>
                        <SelectItem value="cloudy">Nublado</SelectItem>
                        <SelectItem value="rainy">Lluvioso</SelectItem>
                        <SelectItem value="heavy_rain">
                          Lluvia fuerte
                        </SelectItem>
                        <SelectItem value="windy">Ventoso</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.weather && (
                      <p className="text-destructive text-xs">
                        {errors.weather.message}
                      </p>
                    )}
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
                    {errors.distance && (
                      <p className="text-destructive text-xs">
                        {errors.distance.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                type="button"
                onClick={goToStep2}
                disabled={isPending}
                className="w-full"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {/* ── Step 2: optional details ── */}
          {step === 2 && (
            <>
              <Card>
                <CardContent className="flex flex-col gap-4 pt-4">
                  {/* Arco */}
                  <div className="flex flex-col gap-1.5">
                    <Label>Arco</Label>
                    <Select
                      onValueChange={(v) => setValue("bow_id", String(v))}
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
                            {bow.hand === "left" ? "Izq" : "Der"} ·{" "}
                            {bow.draw_weight} lbs
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Flechas */}
                  <div className="flex flex-col gap-1.5">
                    <Label>Flechas</Label>
                    <Select
                      onValueChange={(v) => setValue("arrow_id", String(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona flechas" />
                      </SelectTrigger>
                      <SelectContent>
                        {arrows.map((arrow) => (
                          <SelectItem key={arrow.id} value={arrow.id}>
                            {arrow.brand}
                            {arrow.diameter_mm
                              ? ` · ${arrow.diameter_mm}mm`
                              : ""}
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
                  <div className="flex flex-col gap-1.5">
                    <Label>Hora de inicio</Label>
                    <Input type="datetime-local" {...register("start_time")} />
                  </div>
                </CardContent>
              </Card>

              {serverError && (
                <p className="text-destructive text-sm text-center">
                  {serverError}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isPending}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Atrás
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? "Creando sesión..." : "Comenzar"}
                </Button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}
