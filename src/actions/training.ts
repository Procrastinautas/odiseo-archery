"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database, Json } from "@/types/database";

type TrainingInsert =
  Database["public"]["Tables"]["training_sessions"]["Insert"];
type TrainingUpdate =
  Database["public"]["Tables"]["training_sessions"]["Update"];
type RoundScoreMethod =
  Database["public"]["Tables"]["round_scores"]["Row"]["method"];

// ─── Training Sessions ────────────────────────────────────────────────────────

export async function createTrainingSession(
  data: Omit<TrainingInsert, "user_id">,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session, error } = await supabase
    .from("training_sessions")
    .insert({ ...data, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: session.id };
}

export async function upsertTrainingSession(id: string, data: TrainingUpdate) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("training_sessions")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function finalizeTrainingSession(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("training_sessions")
    .update({
      end_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Rounds ───────────────────────────────────────────────────────────────────

export async function createRound(trainingSessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify session belongs to user
  const { data: session } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("id", trainingSessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return { error: "Sesión no encontrada" };

  // Determine next round number
  const { data: existing } = await supabase
    .from("rounds")
    .select("round_number")
    .eq("training_session_id", trainingSessionId)
    .order("round_number", { ascending: false })
    .limit(1);

  const nextNumber = existing?.length ? existing[0].round_number + 1 : 1;

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      training_session_id: trainingSessionId,
      round_number: nextNumber,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: round.id };
}

export async function deleteRound(roundId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership via training_sessions
  const { data: round } = await supabase
    .from("rounds")
    .select("training_session_id, training_sessions!inner(user_id)")
    .eq("id", roundId)
    .single();

  if (!round) return { error: "Ronda no encontrada" };

  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Round Scores ─────────────────────────────────────────────────────────────

interface RoundScoreData {
  method: RoundScoreMethod;
  data: Json;
  total_score: number | null;
  tens: number | null;
  xs: number | null;
  nines: number | null;
  below_8_count: number | null;
  misses: number | null;
}

export async function upsertRoundScore(
  roundId: string,
  payload: RoundScoreData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("round_scores")
    .upsert({ round_id: roundId, ...payload }, { onConflict: "round_id" });

  if (error) return { error: error.message };
  return { ok: true };
}

// ─── Improvement Areas ────────────────────────────────────────────────────────

export async function createImprovementArea(
  trainingSessionId: string,
  comment: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("improvement_areas")
    .insert({ training_session_id: trainingSessionId, comment });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteImprovementArea(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("improvement_areas")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { ok: true };
}
