"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIAdviceBanner } from "@/components/training/AIAdviceBanner";
import { ImprovementAreas } from "@/components/training/ImprovementAreas";
import { SessionActions } from "@/components/training/SessionActions";
import { SyncStatusIndicator } from "@/components/training/SyncStatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { upsertTrainingSession } from "@/actions/training";
import { toast } from "sonner";
import { getTrainingSaveToastMessage } from "@/lib/training-save-feedback";
import type { Database, Json } from "@/types/database";

type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
type ImprovementArea = Database["public"]["Tables"]["improvement_areas"]["Row"];
type RoundScore = Database["public"]["Tables"]["round_scores"]["Row"];

interface Round {
  id: string;
  round_number: number;
  training_session_id: string;
  created_at: string;
  round_scores: RoundScore | null;
}

interface Props {
  session: TrainingSession;
  rounds: Round[];
  improvementAreas: ImprovementArea[];
}

function getRoundArrowCount(score: RoundScore | null): number | null {
  if (!score) return null;

  if (score.method === "manual") {
    const data = score.data as { arrows?: unknown[] };
    return Array.isArray(data.arrows) ? data.arrows.length : null;
  }

  if (score.method === "summary") {
    const data = score.data as {
      arrow_count?: number;
      tens?: number;
      xs?: number;
      nines?: number;
      below_8?: number;
      misses?: number;
    };

    if (
      typeof data.arrow_count === "number" &&
      Number.isFinite(data.arrow_count)
    ) {
      return data.arrow_count;
    }

    return (
      (data.tens ?? 0) +
      (data.xs ?? 0) +
      (data.nines ?? 0) +
      (data.below_8 ?? 0) +
      (data.misses ?? 0)
    );
  }

  return null;
}

function getPreviousScoredRoundScore(
  rounds: Round[],
  index: number,
): number | null {
  for (let i = index - 1; i >= 0; i -= 1) {
    const value = rounds[i]?.round_scores?.total_score;
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function arrowPreview(data: Json): string {
  const d = data as { arrows?: (number | string)[] };
  if (!d.arrows?.length) return "";
  return d.arrows.join(" · ");
}

function FinalThoughtsInput({
  sessionId,
  initialValue,
}: {
  sessionId: string;
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSave() {
    setSaveError(null);
    setStatus("saving");
    startTransition(async () => {
      const result = await upsertTrainingSession(sessionId, {
        final_thoughts: value,
      });

      if (result.error) {
        const message = getTrainingSaveToastMessage(
          "la reflexión final",
          result.error,
        );
        toast.error(message);
        console.error("Error al guardar la reflexión final", {
          sessionId,
          error: result.error,
        });
        setSaveError(message);
        setStatus("idle");
        return;
      }

      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label>Reflexión final</Label>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {status === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Guardando…</span>
            </>
          )}
          {status === "saved" && (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-green-600">Guardado</span>
            </>
          )}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (saveError) setSaveError(null);
        }}
        placeholder="Pensamientos finales sobre la sesión..."
        rows={4}
      />
      {saveError && <p className="text-xs text-destructive">{saveError}</p>}
      <Button
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={status === "saving"}
        className="self-end"
      >
        Guardar
      </Button>
    </div>
  );
}

export function SessionTabs({ session, rounds, improvementAreas }: Props) {
  const totalScore = rounds.reduce(
    (sum, r) => sum + (r.round_scores?.total_score ?? 0),
    0,
  );

  const bestRoundScore = rounds.reduce<number | null>((best, round) => {
    const score = round.round_scores?.total_score;
    if (typeof score !== "number") return best;
    if (best === null || score > best) return score;
    return best;
  }, null);

  return (
    <Tabs defaultValue="rounds" className="flex flex-col">
      <div className="px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="rounds" className="flex-1">
            Rondas
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">
            Notas
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">
            IA
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── Rondas ── */}
      <TabsContent value="rounds">
        <div className="flex flex-col gap-4 p-4 pb-28 sm:pb-6">
          <SyncStatusIndicator />

          {/* Session total banner */}
          {rounds.length > 0 && (
            <Card>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total acumulado
                </span>
                <span className="text-2xl font-bold">{totalScore} pts</span>
              </CardContent>
            </Card>
          )}

          {/* Round cards */}
          {rounds.length > 0 ? (
            rounds.map((round, index) => {
              const score = round.round_scores ?? null;
              const preview =
                score?.method === "manual" ? arrowPreview(score.data) : null;
              const arrowCount = getRoundArrowCount(score);
              const previousRoundScore = getPreviousScoredRoundScore(
                rounds,
                index,
              );

              const delta =
                typeof score?.total_score === "number" &&
                typeof previousRoundScore === "number"
                  ? score.total_score - previousRoundScore
                  : null;

              const isBestRound =
                bestRoundScore !== null &&
                score?.total_score === bestRoundScore;

              return (
                <Link
                  key={round.id}
                  href={`/training/${session.id}/round/${round.id}`}
                >
                  <Card className="hover:bg-accent/30 transition-colors">
                    <CardContent className="flex flex-col gap-2 px-4 py-3">
                      {/* Top row: round label + score */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              Ronda {round.round_number}
                            </span>
                            {isBestRound ? (
                              <Badge
                                variant="outline"
                                className="h-5 border-emerald-500/40 text-[10px] text-emerald-700 dark:text-emerald-300"
                              >
                                Mejor
                              </Badge>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {arrowCount !== null
                                ? `${arrowCount} flechas`
                                : "Flechas: sin datos"}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {score?.total_score != null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-bold leading-none">
                                {score.total_score} pts
                              </span>
                              {delta !== null ? (
                                <span
                                  className={`text-xs font-semibold ${
                                    delta > 0
                                      ? "text-emerald-600"
                                      : delta < 0
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {delta > 0 ? `+${delta}` : `${delta}`}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Sin puntuación
                            </span>
                          )}
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Arrow preview row (manual scores) */}
                      {preview && (
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-mono tracking-wide text-muted-foreground">
                          {preview}
                        </p>
                      )}

                      {/* Stats badges */}
                      {score &&
                      (score.xs ||
                        score.tens ||
                        score.nines ||
                        score.misses) ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {score.xs ? (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 h-5"
                            >
                              X ×{score.xs}
                            </Badge>
                          ) : null}
                          {score.tens ? (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 h-5"
                            >
                              10 ×{score.tens}
                            </Badge>
                          ) : null}
                          {score.nines ? (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 h-5"
                            >
                              9 ×{score.nines}
                            </Badge>
                          ) : null}
                          {score.misses ? (
                            <Badge
                              variant="destructive"
                              className="text-xs py-0 h-5"
                            >
                              M ×{score.misses}
                            </Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              Aún no hay rondas. Agrega la primera.
            </p>
          )}

          <SessionActions
            trainingSessionId={session.id}
            isFinalized={Boolean(session.end_time)}
            currentRoundCount={rounds.length}
          />
        </div>
      </TabsContent>

      {/* ── Notas ── */}
      <TabsContent value="notes">
        <div className="flex flex-col gap-5 p-4">
          <ImprovementAreas
            trainingSessionId={session.id}
            initialAreas={improvementAreas}
          />
          <FinalThoughtsInput
            sessionId={session.id}
            initialValue={session.final_thoughts ?? ""}
          />
        </div>
      </TabsContent>

      {/* ── IA ── */}
      <TabsContent value="ai">
        <div className="flex flex-col gap-4 p-4">
          <AIAdviceBanner
            trainingSessionId={session.id}
            initialAdvice={session.ai_advice}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
