"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrainingStartRecapCard } from "@/actions/training";

interface Props {
  recapCards: TrainingStartRecapCard[];
  onContinue: () => void;
}

type EmptySlide = {
  id: "empty";
  kind: "empty";
};

type SessionSlide = TrainingStartRecapCard & {
  kind: "session";
};

type Slide = EmptySlide | SessionSlide;

const sessionDateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatSessionDate(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Fecha sin datos";
  return sessionDateFormatter.format(date);
}

function sessionLabel(index: number) {
  return index === 0 ? "Sesion mas reciente" : "Sesion anterior";
}

export function TrainingStartRecapCards({ recapCards, onContinue }: Props) {
  const slides = useMemo<Slide[]>(() => {
    if (!recapCards.length) {
      return [{ id: "empty", kind: "empty" }];
    }

    return recapCards.map((card) => ({
      ...card,
      kind: "session",
    }));
  }, [recapCards]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < slides.length - 1;

  const goTo = useCallback(
    (index: number) => {
      const bounded = Math.max(0, Math.min(slides.length - 1, index));
      setActiveIndex(bounded);
    },
    [slides.length],
  );

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    goTo(activeIndex + 1);
  }, [activeIndex, canGoNext, goTo]);

  const goBack = useCallback(() => {
    if (!canGoBack) return;
    goTo(activeIndex - 1);
  }, [activeIndex, canGoBack, goTo]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goBack();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (slides.length <= 1) return;
    setTouchStartX(event.touches[0]?.clientX ?? null);
    setDragOffset(0);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null) return;
    const currentX = event.touches[0]?.clientX ?? touchStartX;
    setDragOffset(currentX - touchStartX);
  }

  function handleTouchEnd() {
    if (touchStartX === null) return;

    if (dragOffset <= -50) {
      goNext();
    } else if (dragOffset >= 50) {
      goBack();
    }

    setTouchStartX(null);
    setDragOffset(0);
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="border-none bg-gradient-to-br from-brand-olive/25 via-card to-brand-teal/15 ring-brand-green/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader className="gap-1.5 border-b border-border/60 pb-3">
          <Badge className="w-fit bg-brand-green text-primary-foreground">
            Recap rapido
          </Badge>
          <CardTitle className="text-sm sm:text-base">
            Antes de empezar, revisa tus ultimas sesiones
          </CardTitle>
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            Desliza de lado para cambiar tarjeta y desplaza verticalmente para
            leer contenido largo.
          </p>
        </CardHeader>
        <CardContent className="pt-3">
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={cn(
                "flex",
                touchStartX === null &&
                  "transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
              )}
              style={{
                transform: `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`,
              }}
            >
              {slides.map((slide, index) => (
                <div key={slide.id} className="min-w-full">
                  <div className="rounded-lg border border-border/70 bg-card/90 p-2.5 shadow-sm">
                    {slide.kind === "empty" ? (
                      <div className="flex h-[40dvh] min-h-0 flex-col items-start justify-between gap-4 overflow-y-auto overscroll-y-contain pr-1">
                        <div className="space-y-2">
                          <Badge variant="outline">
                            Sin historial reciente
                          </Badge>
                          <p className="text-[13px] leading-snug text-muted-foreground">
                            Todavia no hay sesiones anteriores para mostrar.
                            Empecemos esta nueva con foco y buena tecnica.
                          </p>
                        </div>
                        <div className="rounded-md bg-muted px-2.5 py-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                          Consejo: despues de terminar esta sesion agrega una
                          reflexion final para mejorar este resumen.
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[40dvh] min-h-0 flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {sessionLabel(index)}
                          </div>
                          <Badge variant="outline">
                            {formatSessionDate(slide.created_at)}
                          </Badge>
                        </div>

                        <div className="flex-1 space-y-2 overflow-y-auto overscroll-y-contain pr-1">
                          <section className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs font-semibold text-brand-green">
                              <Target className="h-3.5 w-3.5" /> Areas a mejorar
                            </div>
                            {slide.improvement_areas.length ? (
                              <ul className="space-y-0.5 text-[13px] leading-snug text-muted-foreground">
                                {slide.improvement_areas.map((area) => (
                                  <li key={area}>• {area}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[13px] leading-snug text-muted-foreground">
                                No registraste areas a mejorar en esta sesion.
                              </p>
                            )}
                          </section>

                          <section className="space-y-0.5">
                            <div className="text-xs font-semibold text-brand-bronze">
                              Reflexion final
                            </div>
                            <p className="text-[13px] leading-snug text-muted-foreground whitespace-pre-wrap">
                              {slide.final_reflection ??
                                "No hay reflexion final guardada."}
                            </p>
                          </section>

                          <section className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs font-semibold text-brand-teal">
                              <Lightbulb className="h-3.5 w-3.5" />{" "}
                              Recomendaciones IA
                            </div>
                            {slide.ai_recommendations.length ? (
                              <ul className="space-y-0.5 text-[13px] leading-snug text-muted-foreground">
                                {slide.ai_recommendations.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[13px] leading-snug text-muted-foreground whitespace-pre-wrap">
                                {slide.ai_summary ??
                                  "Sin recomendaciones IA guardadas en esta sesion."}
                              </p>
                            )}
                          </section>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goBack}
              disabled={!canGoBack}
              aria-label="Sesion previa"
              className="h-11 w-11"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1.5">
              {slides.map((slide, index) => (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    activeIndex === index
                      ? "w-6 bg-brand-green"
                      : "w-2 bg-border",
                  )}
                  aria-label={`Ir a tarjeta ${index + 1}`}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Sesion siguiente"
              className="h-11 w-11"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-10">
        <Button type="button" onClick={onContinue} className="h-11 w-full">
          Continuar a nueva sesion
        </Button>
      </div>
    </div>
  );
}
