"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIAdviceBanner } from "@/components/training/AIAdviceBanner";
import { ImprovementAreas } from "@/components/training/ImprovementAreas";
import { SessionActions } from "@/components/training/SessionActions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { upsertTrainingSession } from "@/actions/training";
import type { Database, Json } from "@/types/database";

type TrainingSession = Database["public"]["Tables"]["training_sessions"]["Row"];
type ImprovementArea =
  Database["public"]["Tables"]["improvement_areas"]["Row"];
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

const METHOD_LABELS: Record<string, string> = {
  manual: "Manual",
  summary: "Resumen",
  target_map: "Mapa",
};

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
  const [, startTransition] = useTransition();

  function handleSave() {
    setStatus("saving");
    startTransition(async () => {
      await upsertTrainingSession(sessionId, { final_thoughts: value });
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
        onChange={(e) => setValue(e.target.value)}
        placeholder="Pensamientos finales sobre la sesión..."
        rows={4}
      />
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
        <div className="flex flex-col gap-4 p-4">
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
            rounds.map((round) => {
              const score = round.round_scores ?? null;
              const preview =
                score?.method === "manual" ? arrowPreview(score.data) : null;

              return (
                <Link
                  key={round.id}
                  href={`/training/${session.id}/round/${round.id}`}
                >
                  <Card className="hover:bg-accent/30 transition-colors">
                    <CardContent className="py-3 px-4 flex flex-col gap-1.5">
                      {/* Top row: round label + score */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Ronda {round.round_number}
                          </span>
                          {score && (
                            <Badge variant="secondary" className="text-xs">
                              {METHOD_LABELS[score.method] ?? score.method}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {score?.total_score != null ? (
                            <span className="text-lg font-bold">
                              {score.total_score} pts
                            </span>
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
                        <p className="text-xs text-muted-foreground font-mono tracking-wide">
                          {preview}
                        </p>
                      )}

                      {/* Stats badges */}
                      {score &&
                      (score.xs || score.tens || score.nines || score.misses) ? (
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

          <SessionActions trainingSessionId={session.id} />
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
