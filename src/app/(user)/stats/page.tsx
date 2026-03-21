import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, TrendingUp, Repeat } from "lucide-react";
import type { Json } from "@/types/database";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: totalSessions }, { data: rounds }] = await Promise.all([
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("rounds")
      .select(
        "id, training_sessions!inner(user_id), round_scores(total_score, method, data)",
      )
      .eq("training_sessions.user_id", user.id),
  ]);

  const roundScores =
    rounds
      ?.map((r) => {
        const rel = r.round_scores;
        return Array.isArray(rel) ? (rel[0] ?? null) : rel;
      })
      .filter((score): score is NonNullable<typeof score> => score !== null) ??
    [];

  const scores = roundScores
    .map((r) => r.total_score)
    .filter((s): s is number => s !== null);

  const totalArrows = roundScores.reduce((sum, score) => {
    const data = score.data as Json;

    if (score.method === "manual") {
      const manual = data as { arrows?: unknown[] };
      return sum + (manual.arrows?.length ?? 0);
    }

    if (score.method === "summary") {
      const summary = data as {
        arrow_count?: number;
        tens?: number;
        xs?: number;
        nines?: number;
        below_8?: number;
        misses?: number;
      };

      if (typeof summary.arrow_count === "number") {
        return sum + summary.arrow_count;
      }

      return (
        sum +
        (summary.tens ?? 0) +
        (summary.xs ?? 0) +
        (summary.nines ?? 0) +
        (summary.below_8 ?? 0) +
        (summary.misses ?? 0)
      );
    }

    return sum;
  }, 0);

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const stats = [
    {
      label: "Sesiones totales",
      value: totalSessions ?? 0,
      icon: Calendar,
      description: "entrenamientos registrados",
    },
    {
      label: "Flechas disparadas",
      value: totalArrows,
      icon: Target,
      description: "flechas en total",
    },
    {
      label: "Puntaje promedio",
      value: avgScore ?? "—",
      icon: TrendingUp,
      description: "por ronda",
    },
    {
      label: "Rondas completadas",
      value: scores.length,
      icon: Repeat,
      description: "en todos los entrenamientos",
    },
  ];

  return (
    <div className="flex flex-col">
      <PageHeader title="Estadísticas" />

      <div className="grid grid-cols-2 gap-3 p-4">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
