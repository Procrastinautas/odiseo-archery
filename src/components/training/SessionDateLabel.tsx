"use client";

const sessionDateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatSessionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return sessionDateFormatter.format(date);
}

export function SessionDateLabel({
  date,
  fallback = "Sin fecha de inicio",
}: {
  date: string | null;
  fallback?: string;
}) {
  if (!date) {
    return <span>{fallback}</span>;
  }

  const label = typeof window === "undefined" ? "" : formatSessionDate(date);

  return (
    <time dateTime={date} suppressHydrationWarning>
      {label}
    </time>
  );
}
