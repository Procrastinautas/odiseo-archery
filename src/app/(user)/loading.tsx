export default function UserLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-6 animate-pulse">
      <div className="h-8 w-40 rounded-md bg-muted" />

      <div className="rounded-xl border bg-card p-4">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="mt-3 h-4 w-64 rounded bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 rounded-xl border bg-card" />
        <div className="h-28 rounded-xl border bg-card" />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="mt-3 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-5/6 rounded bg-muted" />
        <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}
