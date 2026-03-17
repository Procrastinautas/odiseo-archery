import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TrainingForm } from "@/components/training/TrainingForm";

export default async function EditTrainingSessionPage({
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

  const [{ data: bows }, { data: arrows }] = await Promise.all([
    supabase.from("bows").select("*").eq("user_id", user.id).order("created_at"),
    supabase
      .from("arrows")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Editar sesión"
        backHref={`/training/${id}`}
      />
      <div className="p-4">
        <TrainingForm
          session={session}
          bows={bows ?? []}
          arrows={arrows ?? []}
        />
      </div>
    </div>
  );
}
