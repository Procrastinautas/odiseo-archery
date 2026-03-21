export type AdvicePriority = "alta" | "media" | "baja";

export interface AAAdviceItem {
  title: string;
  action: string;
  why: string;
  priority: AdvicePriority;
}

export interface CoachingPayload {
  advice_text: string;
  aa_advice_list: AAAdviceItem[];
  aa_recap: string;
}

function stripCodeFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

function isAdviceItem(value: unknown): value is AAAdviceItem {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<AAAdviceItem>;
  return (
    typeof item.title === "string" &&
    typeof item.action === "string" &&
    typeof item.why === "string" &&
    (item.priority === "alta" ||
      item.priority === "media" ||
      item.priority === "baja")
  );
}

export function parseCoachingPayload(
  raw: string | null | undefined,
): CoachingPayload | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(stripCodeFence(raw)) as Partial<CoachingPayload>;
    if (
      typeof parsed.advice_text !== "string" ||
      !Array.isArray(parsed.aa_advice_list) ||
      typeof parsed.aa_recap !== "string" ||
      !parsed.aa_advice_list.every(isAdviceItem)
    ) {
      return null;
    }

    return {
      advice_text: parsed.advice_text.trim(),
      aa_advice_list: parsed.aa_advice_list,
      aa_recap: parsed.aa_recap.trim(),
    };
  } catch {
    return null;
  }
}

export function getAdviceDisplayText(
  raw: string | null | undefined,
): string | null {
  const parsed = parseCoachingPayload(raw);
  if (parsed) return parsed.advice_text;
  return raw ?? null;
}

export function getRecapDisplayText(
  raw: string | null | undefined,
): string | null {
  const parsed = parseCoachingPayload(raw);
  if (parsed) return parsed.aa_recap;
  return raw ?? null;
}
