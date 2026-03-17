import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { SessionTabs } from "@/components/training/SessionTabs";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import type { Database } from "@/types/database";

type RoundScore = Database["public"]["Tables"]["round_scores"]["Row"];
type RoundWithScores = Database["public"]["Tables"]["rounds"]["Row"] & {
  round_scores: RoundScore | null;
};

const TYPE_LABELS: Record<string, string> = {
  control: "Control",
  training: "Entrenamiento",
  contest: "Competencia",
};

export default async function TrainingSessionPage({
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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const [{ data: rounds }, { data: improvementAreas }] = await Promise.all([
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

  const dateLabel = new Date(session.created_at).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col">
      <PageHeader
        title={dateLabel}
        backHref="/training"
        action={
          <Link
            href={`/training/${id}/edit`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Editar
          </Link>
        }
      />

      {/* Session type / distance context strip */}
      {(session.type || session.distance) && (
        <div className="flex gap-1.5 px-4 py-2">
          {session.type && (
            <Badge variant="secondary">{TYPE_LABELS[session.type]}</Badge>
          )}
          {session.distance && (
            <Badge variant="outline">{session.distance}m</Badge>
          )}
        </div>
      )}

      <SessionTabs
        session={session}
        rounds={(rounds ?? []) as RoundWithScores[]}
        improvementAreas={improvementAreas ?? []}
      />
    </div>
  );
}
