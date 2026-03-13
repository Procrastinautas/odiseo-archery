import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewTrainingForm } from "@/components/training/NewTrainingForm";

export default async function NewTrainingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: bows }, { data: arrows }] = await Promise.all([
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
  ]);

  return <NewTrainingForm bows={bows ?? []} arrows={arrows ?? []} />;
}
