import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { TrainingHeaderActions } from "@/components/training/TrainingHeaderActions";
import Link from "next/link";
import { Cloud, CloudRain, Plus, Sun, Target, Wind } from "lucide-react";

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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWeatherIcon(weather: string) {
  if (weather === "sunny") return Sun;
  if (weather === "cloudy") return Cloud;
  if (weather === "rainy") return CloudRain;
  if (weather === "heavy_rain") return CloudRain;
  if (weather === "windy") return Wind;
  return Cloud;
}

function getTotalArrows(rounds: unknown): number | null {
  if (!Array.isArray(rounds) || rounds.length === 0) return null;

  let totalArrows = 0;
  let hasArrowData = false;

  for (const round of rounds) {
    if (!round || typeof round !== "object" || !("round_scores" in round))
      continue;

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

export default async function TrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("training_sessions")
    .select("*, bows(type), rounds(round_scores(method, data))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col">
      <PageHeader title="Entrenamientos" action={<TrainingHeaderActions />} />

      <div className="flex flex-col gap-3 p-4">
        {sessions?.length ? (
          sessions.map((session) => {
            const startTime = formatTime(session.start_time);
            const endTime = formatTime(session.end_time);
            const isFinished = Boolean(session.end_time);
            const totalArrows = getTotalArrows(session.rounds);
            const WeatherIcon = session.weather
              ? getWeatherIcon(session.weather)
              : null;

            return (
              <Card
                key={session.id}
                className={`transition-colors hover:bg-accent/30 ${
                  isFinished
                    ? "border-emerald-500/30"
                    : "border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20"
                }`}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/training/${session.id}`}
                      className="min-w-0 flex-1"
                    >
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-sm">
                          {startTime || endTime
                            ? [
                                startTime ? `Inicio ${startTime}` : null,
                                endTime ? `Fin ${endTime}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : formatDate(session.created_at)}
                        </p>

                        {(startTime || endTime) && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(session.created_at)}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {session.distance ? (
                            <span>{session.distance}m</span>
                          ) : null}

                          {session.weather ? (
                            <span className="inline-flex items-center gap-1">
                              {WeatherIcon ? (
                                <WeatherIcon className="h-3.5 w-3.5" />
                              ) : null}
                              {WEATHER_LABELS[session.weather]}
                            </span>
                          ) : null}

                          <span>
                            Flechas:{" "}
                            {totalArrows && totalArrows > 0
                              ? `${totalArrows}`
                              : "Sin datos"}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          isFinished
                            ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                            : "border-amber-500/50 text-amber-700 dark:text-amber-300"
                        }
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isFinished ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {isFinished ? "Finalizado" : "En curso"}
                      </Badge>

                      {session.type && (
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[session.type]}
                        </Badge>
                      )}
                      <Link
                        href={`/training/${session.id}/summary`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                      >
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
