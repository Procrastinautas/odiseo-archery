"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getAdviceDisplayText,
  getRecapDisplayText,
  parseCoachingPayload,
} from "@/lib/ai-json";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database, Json } from "@/types/database";

type TrainingInsert =
  Database["public"]["Tables"]["training_sessions"]["Insert"];
type TrainingUpdate =
  Database["public"]["Tables"]["training_sessions"]["Update"];
type RoundScoreMethod =
  Database["public"]["Tables"]["round_scores"]["Row"]["method"];

function slog(action: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ t: Date.now(), action, ...data }));
}

export interface TrainingStartRecapCard {
  id: string;
  created_at: string;
  improvement_areas: string[];
  final_reflection: string | null;
  ai_summary: string | null;
  ai_recommendations: string[];
}

type SessionOwnerRelation = { user_id: string } | Array<{ user_id: string }>;

function ownerFromRelation(relation: SessionOwnerRelation | null | undefined) {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0]?.user_id ?? null;
  return relation.user_id;
}

function revalidateTrainingPages(trainingSessionId: string, roundId?: string) {
  revalidatePath("/training");
  revalidatePath(`/training/${trainingSessionId}`);
  revalidatePath(`/training/${trainingSessionId}/edit`);
  revalidatePath(`/training/${trainingSessionId}/summary`);
  if (roundId) {
    revalidatePath(`/training/${trainingSessionId}/round/${roundId}`);
  } else {
    revalidatePath(`/training/${trainingSessionId}/round/[roundId]`, "page");
  }
}

function normalizeRecapText(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.length ? normalized : null;
}

// ─── Training Sessions ────────────────────────────────────────────────────────

export async function createTrainingSession(
  data: Omit<TrainingInsert, "user_id">,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessionId = (data.id as string) || undefined;

  const { data: session, error } = await supabase
    .from("training_sessions")
    .upsert(
      { ...data, user_id: user.id, id: sessionId },
      { onConflict: "id", ignoreDuplicates: true },
    )
    .select("id")
    .single();

  if (error) {
    slog("create_session", {
      userId: user.id,
      clientId: sessionId,
      outcome: "error",
      error: error.message,
    });
    return { error: error.message };
  }

  slog("create_session", {
    userId: user.id,
    clientId: sessionId,
    outcome: "ok",
  });

  revalidateTrainingPages(session.id);
  return { id: session.id };
}

export async function getRecentTrainingStartRecapCards(
  limit = 2,
): Promise<TrainingStartRecapCard[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cappedLimit = Math.min(Math.max(limit, 1), 2);

  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, created_at, final_thoughts, ai_advice, ai_recap, improvement_areas(comment)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(cappedLimit);

  if (error || !data) return [];

  type RecapRow = {
    id: string;
    created_at: string;
    final_thoughts: string | null;
    ai_advice: string | null;
    ai_recap: string | null;
    improvement_areas: Array<{ comment: string }> | null;
  };

  return (data as RecapRow[]).map((row) => {
    const advicePayload = parseCoachingPayload(row.ai_advice);
    const recapPayload = parseCoachingPayload(row.ai_recap);

    const aiSummary =
      normalizeRecapText(advicePayload?.advice_text) ??
      normalizeRecapText(getAdviceDisplayText(row.ai_advice));

    const finalReflection =
      normalizeRecapText(row.final_thoughts) ??
      normalizeRecapText(recapPayload?.aa_recap) ??
      normalizeRecapText(getRecapDisplayText(row.ai_recap));

    const aiRecommendations =
      advicePayload?.aa_advice_list
        .map((item) => normalizeRecapText(`${item.title}: ${item.action}`))
        .filter((item): item is string => Boolean(item))
        .slice(0, 3) ?? [];

    const improvementAreas = (row.improvement_areas ?? [])
      .map((area) => normalizeRecapText(area.comment))
      .filter((area): area is string => Boolean(area))
      .slice(0, 4);

    return {
      id: row.id,
      created_at: row.created_at,
      improvement_areas: improvementAreas,
      final_reflection: finalReflection,
      ai_summary: aiSummary,
      ai_recommendations: aiRecommendations,
    };
  });
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

  if (error) {
    slog("upsert_session", {
      userId: user.id,
      sessionId: id,
      fields: Object.keys(data),
      outcome: "error",
      error: error.message,
    });
    return { error: error.message };
  }

  slog("upsert_session", {
    userId: user.id,
    sessionId: id,
    fields: Object.keys(data),
    outcome: "ok",
  });

  revalidateTrainingPages(id);
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
  revalidateTrainingPages(id);
  return { ok: true };
}

export async function deleteTrainingSession(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deleted, error } = await supabase
    .from("training_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) return { error: error.message };
  if (!deleted?.length) return { error: "Sesión no encontrada" };

  revalidateTrainingPages(id);
  return { ok: true };
}

// ─── Rounds ───────────────────────────────────────────────────────────────────

export async function createRound(
  trainingSessionId: string,
  params: { clientId: string; roundNumber: number },
) {
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

  if (!session) {
    slog("create_round", {
      userId: user.id,
      sessionId: trainingSessionId,
      roundId: params.clientId,
      outcome: "error",
      error: "Sesión no encontrada",
    });
    return { error: "Sesión no encontrada" };
  }

  const { data: round, error } = await supabase
    .from("rounds")
    .insert({
      id: params.clientId,
      training_session_id: trainingSessionId,
      round_number: params.roundNumber,
    })
    .select("id")
    .single();

  if (error) {
    // Check if it's a unique constraint violation (same round number already exists)
    if (error.message.includes("unique") || error.message.includes("Uniqueness")) {
      // Try to get the actual round for this round number
      const { data: existing } = await supabase
        .from("rounds")
        .select("id")
        .eq("training_session_id", trainingSessionId)
        .eq("round_number", params.roundNumber)
        .single();

      if (existing) {
        slog("create_round", {
          userId: user.id,
          sessionId: trainingSessionId,
          roundId: params.clientId,
          roundNumber: params.roundNumber,
          outcome: "conflict",
          existingRoundId: existing.id,
        });
        return {
          error: "Ronda con este número ya existe. Verifica en la lista de rondas.",
        };
      }
    }

    slog("create_round", {
      userId: user.id,
      sessionId: trainingSessionId,
      roundId: params.clientId,
      roundNumber: params.roundNumber,
      outcome: "error",
      error: error.message,
    });
    return { error: error.message };
  }

  slog("create_round", {
    userId: user.id,
    sessionId: trainingSessionId,
    roundId: params.clientId,
    roundNumber: params.roundNumber,
    outcome: "ok",
  });

  revalidateTrainingPages(trainingSessionId, round.id);
  return { id: round.id };
}

export async function deleteRound(roundId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("id, training_session_id, training_sessions!inner(user_id)")
    .eq("id", roundId)
    .single();

  if (roundError || !round) return { error: "Ronda no encontrada" };

  const ownerId = ownerFromRelation(
    round.training_sessions as SessionOwnerRelation,
  );
  if (ownerId !== user.id) {
    return { error: "No tienes permiso para eliminar esta ronda" };
  }

  const { error } = await supabase.from("rounds").delete().eq("id", roundId);
  if (error) return { error: error.message };

  revalidateTrainingPages(round.training_session_id, roundId);
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

  const { data: round, error: roundError } = await supabase
    .from("rounds")
    .select("id, training_session_id, training_sessions!inner(user_id)")
    .eq("id", roundId)
    .single();

  if (roundError || !round) {
    slog("upsert_round_score", {
      userId: user.id,
      roundId,
      outcome: "error",
      error: "Ronda no encontrada",
    });
    return { error: "Ronda no encontrada" };
  }

  const ownerId = ownerFromRelation(
    round.training_sessions as SessionOwnerRelation,
  );
  if (ownerId !== user.id) {
    slog("upsert_round_score", {
      userId: user.id,
      roundId,
      outcome: "error",
      error: "No tiene permiso",
    });
    return { error: "No tienes permiso para guardar esta ronda" };
  }

  const { error } = await supabase
    .from("round_scores")
    .upsert({ round_id: roundId, ...payload }, { onConflict: "round_id" });

  if (error) {
    slog("upsert_round_score", {
      userId: user.id,
      roundId,
      method: payload.method,
      outcome: "error",
      error: error.message,
    });
    return { error: error.message };
  }

  slog("upsert_round_score", {
    userId: user.id,
    roundId,
    method: payload.method,
    outcome: "ok",
  });

  revalidateTrainingPages(round.training_session_id, roundId);
  return { ok: true };
}

// ─── Improvement Areas ────────────────────────────────────────────────────────

export async function createImprovementArea(
  trainingSessionId: string,
  comment: string,
  clientId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("improvement_areas")
    .upsert(
      {
        id: clientId,
        training_session_id: trainingSessionId,
        comment,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

  if (error) {
    slog("create_improvement_area", {
      userId: user.id,
      sessionId: trainingSessionId,
      clientId,
      outcome: "error",
      error: error.message,
    });
    return { error: error.message };
  }

  slog("create_improvement_area", {
    userId: user.id,
    sessionId: trainingSessionId,
    clientId,
    outcome: "ok",
  });

  revalidateTrainingPages(trainingSessionId);
  return { ok: true };
}

export async function deleteImprovementArea(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: area, error: areaError } = await supabase
    .from("improvement_areas")
    .select("id, training_session_id, training_sessions!inner(user_id)")
    .eq("id", id)
    .single();

  if (areaError || !area) return { error: "Área de mejora no encontrada" };

  const ownerId = ownerFromRelation(
    area.training_sessions as SessionOwnerRelation,
  );
  if (ownerId !== user.id) {
    return { error: "No tienes permiso para eliminar esta área" };
  }

  const { error } = await supabase
    .from("improvement_areas")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidateTrainingPages(area.training_session_id);
  return { ok: true };
}

type ImportNormalizedRow = {
  rowNumber: number;
  startTime: string;
  endTime: string;
  distance: number;
  arrowCount: number;
  comments: string | null;
};

type ImportRowError = {
  rowNumber: number;
  reason: string;
};

const MONTHS_ES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function normalizeText(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseClipboardTable(rawText: string): string[][] {
  const text = rawText.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "\t" && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim().length > 0));
}

function isHeaderRow(cells: string[]) {
  const normalized = cells.map((cell) => normalizeText(cell));
  return (
    normalized.some((cell) => cell.includes("fecha")) &&
    normalized.some((cell) => cell.includes("hora")) &&
    normalized.some((cell) => cell.includes("flechas"))
  );
}

function parseDateEs(dateRaw: string) {
  const cleaned = normalizeText(dateRaw).replace(/,/g, " ");
  const match = cleaned.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTHS_ES[match[2]];
  const year = Number(match[3]);

  if (!month || !Number.isInteger(day) || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseHourRange(hourRaw: string) {
  const match = hourRaw
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const sh = Number(match[1]);
  const sm = Number(match[2]);
  const eh = Number(match[3]);
  const em = Number(match[4]);

  const validHours = [sh, eh].every((v) => v >= 0 && v <= 23);
  const validMinutes = [sm, em].every((v) => v >= 0 && v <= 59);
  if (!validHours || !validMinutes) return null;

  return {
    start: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
    end: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
  };
}

function parseDistance(distanceRaw: string) {
  const match = distanceRaw.replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function parseArrowCount(arrowRaw: string) {
  const match = arrowRaw.match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  if (!Number.isInteger(value) || value <= 0) return null;
  return value;
}

function splitArrowsIntoRounds(arrowCount: number) {
  const rounds: number[] = [];
  let remaining = arrowCount;

  while (remaining > 0) {
    const next = Math.min(6, remaining);
    rounds.push(next);
    remaining -= next;
  }

  return rounds;
}

function normalizeImportRows(rawText: string) {
  const parsedRows = parseClipboardTable(rawText);
  if (!parsedRows.length) {
    return {
      validRows: [] as ImportNormalizedRow[],
      errors: [
        { rowNumber: 0, reason: "No se detectaron filas para importar" },
      ] as ImportRowError[],
    };
  }

  const rows = isHeaderRow(parsedRows[0]) ? parsedRows.slice(1) : parsedRows;
  const validRows: ImportNormalizedRow[] = [];
  const errors: ImportRowError[] = [];

  rows.forEach((cells, index) => {
    const rowNumber = index + 1;
    const [
      dateRaw = "",
      hourRaw = "",
      distanceRaw = "",
      arrowsRaw = "",
      ...rest
    ] = cells;

    if (!dateRaw && !hourRaw && !distanceRaw && !arrowsRaw) return;

    const date = parseDateEs(dateRaw);
    if (!date) {
      errors.push({ rowNumber, reason: "Fecha inválida" });
      return;
    }

    const hourRange = parseHourRange(hourRaw);
    if (!hourRange) {
      errors.push({ rowNumber, reason: "Rango de hora inválido" });
      return;
    }

    const distance = parseDistance(distanceRaw);
    if (distance === null) {
      errors.push({ rowNumber, reason: "Distancia inválida" });
      return;
    }

    const arrowCount = parseArrowCount(arrowsRaw);
    if (arrowCount === null) {
      errors.push({ rowNumber, reason: "Cantidad de flechas inválida" });
      return;
    }

    const commentsRaw = rest.join("\t").trim();
    const comments = commentsRaw && commentsRaw !== "-" ? commentsRaw : null;

    validRows.push({
      rowNumber,
      startTime: `${date}T${hourRange.start}:00`,
      endTime: `${date}T${hourRange.end}:00`,
      distance,
      arrowCount,
      comments,
    });
  });

  return { validRows, errors };
}

export async function importTrainingSessionsFromClipboard(rawText: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { validRows, errors } = normalizeImportRows(rawText);
  const failed: ImportRowError[] = [...errors];

  if (!validRows.length) {
    return {
      error: "No hay filas válidas para importar",
      importedCount: 0,
      totalRows: failed.length,
      failed,
    };
  }

  let importedCount = 0;

  for (const row of validRows) {
    const { data: session, error: sessionError } = await supabase
      .from("training_sessions")
      .insert({
        user_id: user.id,
        type: null,
        weather: null,
        distance: row.distance,
        start_time: row.startTime,
        end_time: row.endTime,
        final_thoughts: row.comments,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      failed.push({
        rowNumber: row.rowNumber,
        reason: sessionError?.message ?? "No se pudo crear la sesión",
      });
      continue;
    }

    let rowFailed = false;
    const roundArrowCounts = splitArrowsIntoRounds(row.arrowCount);

    for (let i = 0; i < roundArrowCounts.length; i++) {
      const { data: round, error: roundError } = await supabase
        .from("rounds")
        .insert({
          training_session_id: session.id,
          round_number: i + 1,
        })
        .select("id")
        .single();

      if (roundError || !round) {
        failed.push({
          rowNumber: row.rowNumber,
          reason: roundError?.message ?? "No se pudo crear una ronda",
        });
        rowFailed = true;
        break;
      }

      const { error: scoreError } = await supabase.from("round_scores").insert({
        round_id: round.id,
        method: "summary",
        data: { arrow_count: roundArrowCounts[i] },
        total_score: 0,
        tens: 0,
        xs: 0,
        nines: 0,
        below_8_count: 0,
        misses: 0,
      });

      if (scoreError) {
        failed.push({ rowNumber: row.rowNumber, reason: scoreError.message });
        rowFailed = true;
        break;
      }
    }

    if (rowFailed) {
      await supabase.from("training_sessions").delete().eq("id", session.id);
      continue;
    }

    importedCount += 1;
  }

  revalidatePath("/training");

  return {
    ok: true,
    importedCount,
    totalRows: validRows.length + errors.length,
    failed,
  };
}
