export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-8 w-44 rounded-md bg-muted" />
      <div className="rounded-xl border bg-card p-4">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-10/12 rounded bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-32 rounded-xl border bg-card" />
        <div className="h-32 rounded-xl border bg-card" />
      </div>
    </div>
  );
}
