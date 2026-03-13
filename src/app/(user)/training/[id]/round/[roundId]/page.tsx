import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoundForm } from "@/components/training/RoundForm";

export default async function RoundPage({
  params,
}: {
  params: Promise<{ id: string; roundId: string }>;
}) {
  const { id, roundId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify round belongs to a session owned by this user
  const { data: round } = await supabase
    .from("rounds")
    .select("*, training_sessions!inner(user_id), round_scores(*)")
    .eq("id", roundId)
    .eq("training_session_id", id)
    .single();

  if (!round) notFound();

  const session = round.training_sessions as { user_id: string };
  if (session.user_id !== user.id) notFound();

  const existingScore = round.round_scores?.[0] ?? null;

  return (
    <div className="flex flex-col">
      <PageHeader title={`Ronda ${round.round_number}`} />
      <RoundForm
        roundId={roundId}
        roundNumber={round.round_number}
        trainingSessionId={id}
        existingScore={existingScore}
      />
    </div>
  );
}
