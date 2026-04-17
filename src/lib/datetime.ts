const DATE_TIME_LOCAL_FORMAT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toValidDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getCurrentDatetimeLocalValue() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function formatUtcIsoToDatetimeLocalValue(value: string | null | undefined) {
  if (!value) return "";

  const date = toValidDate(value);
  if (!date) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocalValueToUtcIso(
  value: string | null | undefined,
) {
  if (!value) return null;

  const match = DATE_TIME_LOCAL_FORMAT.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute, second = "0"] = match;
  const localDate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  return Number.isNaN(localDate.getTime()) ? null : localDate.toISOString();
}