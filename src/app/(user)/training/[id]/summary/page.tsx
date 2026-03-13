import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ScoreChart } from "@/components/training/ScoreChart";

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

export default async function TrainingSummaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("training_sessions")
    .select("*, bows(type, hand, draw_weight), arrows(brand, diameter_mm)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const [{ data: rounds }, { data: areas }] = await Promise.all([
    supabase
      .from("rounds")
      .select("*, round_scores(*)")
      .eq("training_session_id", id)
      .order("round_number"),
    supabase
      .from("improvement_areas")
      .select("*")
      .eq("training_session_id", id)
      .order("created_at"),
  ]);

  // Compute aggregate totals
  const roundsWithScores = rounds ?? [];
  const totalScore = roundsWithScores.reduce(
    (sum, r) => sum + (r.round_scores?.[0]?.total_score ?? 0),
    0,
  );
  const totalArrows = roundsWithScores.reduce((sum, r) => {
    const score = r.round_scores?.[0];
    if (!score) return sum;
    if (score.method === "manual") {
      const data = score.data as { arrows?: unknown[] };
      return sum + (data.arrows?.length ?? 0);
    }
    if (score.method === "summary") {
      const data = score.data as {
        tens?: number;
        xs?: number;
        nines?: number;
        below_8?: number;
        misses?: number;
      };
      return (
        sum +
        (data.tens ?? 0) +
        (data.xs ?? 0) +
        (data.nines ?? 0) +
        (data.below_8 ?? 0) +
        (data.misses ?? 0)
      );
    }
    return sum;
  }, 0);

  const chartData = roundsWithScores.map((r) => ({
    name: `R${r.round_number}`,
    puntaje: r.round_scores?.[0]?.total_score ?? 0,
  }));

  const bow = session.bows as {
    type: string;
    hand: string;
    draw_weight: number;
  } | null;
  const arrow = session.arrows as {
    brand: string;
    diameter_mm: number | null;
  } | null;

  const dateLabel = new Date(session.created_at).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Resumen de sesión" />

      <div className="flex flex-col gap-4 p-4">
        {/* Back link */}
        <Link
          href={`/training/${id}`}
          className={
            buttonVariants({ variant: "ghost", size: "sm" }) +
            " self-start -ml-1"
          }
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Editar sesión
        </Link>

        {/* Metadata */}
        <Card>
          <CardContent className="pt-4 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <div className="flex flex-wrap gap-2">
              {session.type && (
                <Badge variant="secondary">{TYPE_LABELS[session.type]}</Badge>
              )}
              {session.weather && (
                <Badge variant="outline">
                  {WEATHER_LABELS[session.weather]}
                </Badge>
              )}
              {session.distance && (
                <Badge variant="outline">{session.distance}m</Badge>
              )}
            </div>
            {bow && (
              <p className="text-sm text-muted-foreground">
                Arco:{" "}
                {bow.type === "recurve"
                  ? "Recurvo"
                  : bow.type === "compound"
                    ? "Compound"
                    : "Barebow"}{" "}
                · {bow.hand === "left" ? "Izq" : "Der"} · {bow.draw_weight} lbs
              </p>
            )}
            {arrow && (
              <p className="text-sm text-muted-foreground">
                Flechas: {arrow.brand}
                {arrow.diameter_mm ? ` · ${arrow.diameter_mm}mm` : ""}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 flex flex-col items-center">
              <span className="text-3xl font-bold">{totalScore}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Puntaje total
              </span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 flex flex-col items-center">
              <span className="text-3xl font-bold">{totalArrows}</span>
              <span className="text-xs text-muted-foreground mt-0.5">
                Flechas totales
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Score chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Puntaje por ronda</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreChart data={chartData} />
            </CardContent>
          </Card>
        )}

        {/* Improvement areas */}
        {areas && areas.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Áreas a mejorar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              {areas.map((area) => (
                <p key={area.id} className="text-sm">
                  • {area.comment}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* AI Recap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Resumen de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {session.ai_recap ? (
              <p className="text-sm leading-relaxed">{session.ai_recap}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                El resumen se generó al finalizar la sesión. Si no aparece,
                regresa a la sesión y presiona "Finalizar sesión" nuevamente.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Final thoughts */}
        {session.final_thoughts && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Reflexión final</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {session.final_thoughts}
              </p>
            </CardContent>
          </Card>
        )}

        <Link
          href="/training"
          className={buttonVariants({ variant: "outline" }) + " w-full"}
        >
          Volver al historial
        </Link>
      </div>
    </div>
  );
}
