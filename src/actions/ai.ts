"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function getTrainingAdvice(
  trainingSessionId: string,
): Promise<{ advice: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!openai) return { advice: null, error: "AI no disponible" };

  // Fetch last 3 sessions with round scores for context
  const { data: sessions } = await supabase
    .from("training_sessions")
    .select(
      "id, type, distance, weather, physical_status, final_thoughts, rounds(round_number, round_scores(method, total_score, tens, xs, misses))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const context = sessions
    ? sessions.map((s) => ({
        type: s.type,
        distance: s.distance,
        weather: s.weather,
        physicalStatus: s.physical_status,
        finalThoughts: s.final_thoughts,
        rounds: s.rounds?.map((r) => r.round_scores),
      }))
    : [];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "Eres un entrenador de tiro con arco. Da un consejo conciso (máx 3 oraciones) en español para la sesión actual basado en el historial reciente del arquero.",
        },
        {
          role: "user",
          content: `Historial de sesiones recientes: ${JSON.stringify(context)}. Da un consejo para la sesión de hoy.`,
        },
      ],
    });

    const advice = completion.choices[0]?.message?.content ?? null;

    // Persist advice to the current training session
    await supabase
      .from("training_sessions")
      .update({ ai_advice: advice, updated_at: new Date().toISOString() })
      .eq("id", trainingSessionId)
      .eq("user_id", user.id);

    return { advice };
  } catch {
    return { advice: null, error: "Error al obtener consejo de IA" };
  }
}

export async function getSessionRecap(
  trainingSessionId: string,
): Promise<{ recap: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!openai) return { recap: null, error: "AI no disponible" };

  // Fetch the full session data for recap
  const { data: session } = await supabase
    .from("training_sessions")
    .select(
      "*, rounds(round_number, round_scores(*)), improvement_areas(comment)",
    )
    .eq("id", trainingSessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return { recap: null, error: "Sesión no encontrada" };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "Eres un entrenador de tiro con arco. Genera un resumen conciso de la sesión de entrenamiento en español (máx 4 oraciones): qué salió bien, qué mejorar, y un tip para la siguiente sesión.",
        },
        {
          role: "user",
          content: `datos de la sesión: ${JSON.stringify(session)}`,
        },
      ],
    });

    const recap = completion.choices[0]?.message?.content ?? null;

    await supabase
      .from("training_sessions")
      .update({ ai_recap: recap, updated_at: new Date().toISOString() })
      .eq("id", trainingSessionId)
      .eq("user_id", user.id);

    return { recap };
  } catch {
    return { recap: null, error: "Error al generar resumen de IA" };
  }
}
