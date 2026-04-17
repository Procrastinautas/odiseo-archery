import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTrainingFormClient } from "@/components/training/NewTrainingFormClient";
import { getRecentTrainingStartRecapCards } from "@/actions/training";

export default async function NewTrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: bows }, { data: arrows }, recapCards] = await Promise.all([
    supabase
      .from("bows")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
    supabase
      .from("arrows")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
    getRecentTrainingStartRecapCards(2),
  ]);

  return (
    <NewTrainingFormClient
      bows={bows ?? []}
      arrows={arrows ?? []}
      recapCards={recapCards}
    />
  );
}
