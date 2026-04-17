import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { TrainingHeaderActions } from "@/components/training/TrainingHeaderActions";
import type { Database } from "@/types/database";
import Link from "next/link";
import {
  Calendar,
  Cloud,
  CloudRain,
  Plus,
  Settings2,
  Sun,
  Target,
  TrendingUp,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { SessionDateLabel } from "@/components/training/SessionDateLabel";

const TYPE_LABELS: Record<string, string> = {
  control: "Control",
  training: "Entrenamiento",
  contest: "Competencia",
};

const WEATHER_LABELS: Record<string, string> = {
  sunny: "Soleado",
  cloudy: "Nublado",
  rainy: "Lluvioso",
  heavy_rain: "Lluvia fuerte",
  windy: "Ventoso",
};

const BOW_TYPE_LABELS: Record<string, string> = {
  recurve: "Recurvo",
  compound: "Compuesto",
  barebow: "Barebow",
};

type TrainingCardSession = Pick<
  Database["public"]["Tables"]["training_sessions"]["Row"],
  "id" | "start_time" | "end_time" | "weather" | "type" | "distance"
> & {
  bows: Pick<
    Database["public"]["Tables"]["bows"]["Row"],
    "type" | "draw_weight"
  > | null;
  arrows: Pick<
    Database["public"]["Tables"]["arrows"]["Row"],
    "brand" | "diameter_mm" | "shaft_material"
  > | null;
  rounds:
    | {
        id: string;
        round_scores: Pick<
          Database["public"]["Tables"]["round_scores"]["Row"],
          "method" | "data" | "total_score" | "xs" | "tens" | "misses"
        > | null;
      }[]
    | null;
};

function getWeatherIcon(weather: string) {
  if (weather === "sunny") return Sun;
  if (weather === "cloudy") return Cloud;
  if (weather === "rainy") return CloudRain;
  if (weather === "heavy_rain") return CloudRain;
  if (weather === "windy") return Wind;
  return Cloud;
}

function roundMetricValue(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function metricIconAccentClasses(
  tone: "score" | "pace" | "volume" | "neutral",
  hasData: boolean,
) {
  if (!hasData) {
    return "bg-muted text-muted-foreground/80";
  }

  if (tone === "score") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }

  if (tone === "pace") {
    return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
  }

  if (tone === "volume") {
    return "bg-teal-500/15 text-teal-700 dark:text-teal-300";
  }

  return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
}

function formatBowSnapshot(
  bow: { type?: string | null; draw_weight?: number | null } | null,
) {
  if (!bow?.type && bow?.draw_weight == null) return "Sin arco";

  const typeLabel = bow?.type ? (BOW_TYPE_LABELS[bow.type] ?? bow.type) : null;
  const drawWeightLabel =
    typeof bow?.draw_weight === "number" && Number.isFinite(bow.draw_weight)
      ? `${bow.draw_weight}#`
      : null;

  return [typeLabel, drawWeightLabel].filter(Boolean).join(" · ");
}

function formatArrowSnapshot(
  arrow: {
    brand?: string | null;
    diameter_mm?: number | null;
    shaft_material?: string | null;
  } | null,
) {
  if (!arrow?.brand && arrow?.diameter_mm == null && !arrow?.shaft_material) {
    return "Sin flecha";
  }

  const diameterLabel =
    typeof arrow?.diameter_mm === "number" && Number.isFinite(arrow.diameter_mm)
      ? `${arrow.diameter_mm} mm`
      : null;

  return [arrow?.brand, diameterLabel, arrow?.shaft_material]
    .filter(Boolean)
    .join(" · ");
}

function getTotalArrows(rounds: unknown): number | null {
  if (!Array.isArray(rounds) || rounds.length === 0) return null;

  let totalArrows = 0;
  let hasArrowData = false;

  for (const round of rounds) {
    if (!round || typeof round !== "object" || !("round_scores" in round)) {
      continue;
    }

    const roundScores = (round as { round_scores?: unknown }).round_scores;
    if (!roundScores || typeof roundScores !== "object") continue;

    const method = (roundScores as { method?: unknown }).method;
    const data = (roundScores as { data?: unknown }).data;

    if (method === "manual") {
      const arrows = (data as { arrows?: unknown[] } | null)?.arrows;
      if (Array.isArray(arrows)) {
        totalArrows += arrows.length;
        hasArrowData = true;
      }
      continue;
    }

    if (method === "summary") {
      const arrowCount = (data as { arrow_count?: unknown } | null)
        ?.arrow_count;
      if (typeof arrowCount === "number" && Number.isFinite(arrowCount)) {
        totalArrows += arrowCount;
        hasArrowData = true;
      }
    }
  }

  return hasArrowData ? totalArrows : null;
}

function getRoundArrowCount(roundScore: unknown): number | null {
  if (!roundScore || typeof roundScore !== "object") return null;

  const method = (roundScore as { method?: unknown }).method;
  const data = (roundScore as { data?: unknown }).data;

  if (method === "manual") {
    const arrows = (data as { arrows?: unknown[] } | null)?.arrows;
    return Array.isArray(arrows) ? arrows.length : null;
  }

  if (method === "summary") {
    const arrowCount = (data as { arrow_count?: unknown } | null)?.arrow_count;
    if (typeof arrowCount === "number" && Number.isFinite(arrowCount)) {
      return arrowCount;
    }
  }

  return null;
}

function getSessionMetrics(rounds: unknown) {
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return {
      totalScore: null as number | null,
      roundCount: 0,
      totalArrows: null as number | null,
      averagePerRound: null as number | null,
      xs: 0,
      tens: 0,
      misses: 0,
      accuracy: null as number | null,
    };
  }

  let totalScore = 0;
  let hasScore = false;
  let scoredRounds = 0;
  let scoredRoundArrows = 0;
  let hasScoredRoundArrowData = false;
  let scoredRoundMisses = 0;
  let xs = 0;
  let tens = 0;
  let misses = 0;

  for (const round of rounds) {
    if (!round || typeof round !== "object" || !("round_scores" in round)) {
      continue;
    }

    const score = (round as { round_scores?: unknown }).round_scores;
    if (!score || typeof score !== "object") continue;

    const total = (score as { total_score?: unknown }).total_score;
    const roundXs = (score as { xs?: unknown }).xs;
    const roundTens = (score as { tens?: unknown }).tens;
    const roundMisses = (score as { misses?: unknown }).misses;

    if (typeof total === "number" && Number.isFinite(total)) {
      totalScore += total;
      hasScore = true;
      scoredRounds += 1;

      const roundArrowCount = getRoundArrowCount(score);
      if (
        typeof roundArrowCount === "number" &&
        Number.isFinite(roundArrowCount)
      ) {
        scoredRoundArrows += roundArrowCount;
        hasScoredRoundArrowData = true;
      }

      if (typeof roundMisses === "number" && Number.isFinite(roundMisses)) {
        scoredRoundMisses += roundMisses;
      }
    }

    if (typeof roundXs === "number" && Number.isFinite(roundXs)) xs += roundXs;
    if (typeof roundTens === "number" && Number.isFinite(roundTens)) {
      tens += roundTens;
    }
    if (typeof roundMisses === "number" && Number.isFinite(roundMisses)) {
      misses += roundMisses;
    }
  }

  const totalArrows = getTotalArrows(rounds);
  const averagePerRound =
    hasScore && scoredRounds > 0 ? totalScore / scoredRounds : null;

  const accuracy =
    hasScoredRoundArrowData && scoredRoundArrows > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((scoredRoundArrows - scoredRoundMisses) / scoredRoundArrows) * 100,
          ),
        )
      : null;

  return {
    totalScore: hasScore ? totalScore : null,
    roundCount: rounds.length,
    totalArrows,
    averagePerRound,
    xs,
    tens,
    misses,
    accuracy,
  };
}

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select(
      "id, start_time, end_time, weather, type, distance, bows(type, draw_weight), arrows(brand, diameter_mm, shaft_material), rounds(id, round_scores(method, data, total_score, xs, tens, misses))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const typedSessions = (sessions ?? []) as TrainingCardSession[];

  return (
    <div className="flex flex-col">
      <PageHeader title="Entrenamientos" action={<TrainingHeaderActions />} />

      <div className="flex flex-col gap-3 p-4">
        {typedSessions.length ? (
          typedSessions.map((session) => {
            const isFinished = Boolean(session.end_time);
            const metrics = getSessionMetrics(session.rounds);
            const WeatherIcon = session.weather
              ? getWeatherIcon(session.weather)
              : null;

            const topMetrics = [
              {
                label: "Puntaje",
                icon: Target,
                tone: "score",
                hasData: metrics.totalScore != null,
                value:
                  metrics.totalScore != null
                    ? `${metrics.totalScore} pts`
                    : "Sin datos",
              },
              {
                label: "Promedio",
                icon: TrendingUp,
                tone: "pace",
                hasData: metrics.averagePerRound != null,
                value:
                  metrics.averagePerRound != null
                    ? `${roundMetricValue(metrics.averagePerRound)} pts`
                    : "Sin datos",
              },
              {
                label: "Flechas",
                icon: Wind,
                tone: "volume",
                hasData: metrics.totalArrows != null,
                value:
                  metrics.totalArrows != null
                    ? `${metrics.totalArrows}`
                    : "Sin datos",
              },
              {
                label: "Rondas",
                icon: Calendar,
                tone: "neutral",
                hasData: metrics.roundCount > 0,
                value: `${metrics.roundCount}`,
              },
            ] as {
              label: string;
              icon: LucideIcon;
              tone: "score" | "pace" | "volume" | "neutral";
              hasData: boolean;
              value: string;
            }[];

            const showHitQuality =
              metrics.xs > 0 || metrics.tens > 0 || metrics.misses > 0;

            return (
              <Card
                key={session.id}
                className={`overflow-hidden transition-all hover:bg-accent/30 hover:shadow-sm ${
                  isFinished
                    ? "border-emerald-500/30"
                    : "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20"
                }`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1.5 min-w-0">
                        <p className="font-semibold text-sm sm:text-base leading-none">
                          <SessionDateLabel date={session.start_time} />
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {session.distance ? (
                            <span className="inline-flex items-center leading-none">
                              {session.distance}m
                            </span>
                          ) : null}

                          {session.weather ? (
                            <span className="inline-flex items-center gap-1 leading-none">
                              {WeatherIcon ? (
                                <WeatherIcon
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 shrink-0"
                                />
                              ) : null}
                              {WEATHER_LABELS[session.weather]}
                            </span>
                          ) : null}

                          {metrics.accuracy != null ? (
                            <span className="inline-flex items-center gap-1 leading-none">
                              <Target
                                aria-hidden="true"
                                className="h-3.5 w-3.5 shrink-0"
                              />
                              Precisión: {Math.round(metrics.accuracy)}%
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                        {session.type ? (
                          <Badge variant="secondary" className="text-xs">
                            {TYPE_LABELS[session.type]}
                          </Badge>
                        ) : null}

                        <Badge
                          variant="outline"
                          className={
                            isFinished
                              ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                              : "border-amber-500/50 text-amber-700 dark:text-amber-300"
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${
                              isFinished ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {isFinished ? "Finalizado" : "En curso"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
                      {topMetrics.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-md border border-border/70 bg-background/65 px-2 py-2 sm:px-2.5"
                        >
                          <p className="inline-flex min-h-4 items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            <span
                              className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm ${metricIconAccentClasses(item.tone, item.hasData)}`}
                            >
                              <item.icon
                                aria-hidden="true"
                                className="h-2.5 w-2.5"
                              />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-none sm:leading-tight">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {showHitQuality ? (
                      <div className="flex flex-wrap gap-1.5">
                        {metrics.xs > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            X ×{metrics.xs}
                          </Badge>
                        ) : null}

                        {metrics.tens > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            10 ×{metrics.tens}
                          </Badge>
                        ) : null}

                        {metrics.misses > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            M ×{metrics.misses}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                      <span>Arco: {formatBowSnapshot(session.bows)}</span>
                      <span>Flecha: {formatArrowSnapshot(session.arrows)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 sm:max-w-sm sm:self-end">
                      <Link
                        href={`/training/${session.id}`}
                        className={`${buttonVariants({ variant: "outline" })} h-11 w-full px-4`}
                      >
                        <Settings2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Detalles
                      </Link>

                      <Link
                        href={`/training/${session.id}/summary`}
                        className={`${buttonVariants({ size: "lg" })} h-11 w-full px-4`}
                      >
                        <TrendingUp
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                        Resumen
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Target className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Aún no tienes entrenamientos registrados
              </p>
              <Link
                href="/training/new"
                className={buttonVariants({ size: "sm" })}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Iniciar entreno
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
