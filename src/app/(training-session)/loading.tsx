export default function TrainingSessionLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-6 animate-pulse">
      <div className="h-8 w-44 rounded-md bg-muted" />

      <div className="rounded-xl border bg-card p-4">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-9 w-full rounded bg-muted" />
        <div className="mt-2 h-9 w-full rounded bg-muted" />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="h-4 w-36 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-11/12 rounded bg-muted" />
        <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="h-10 rounded bg-muted" />
        <div className="h-10 rounded bg-muted" />
      </div>
    </div>
  );
}
