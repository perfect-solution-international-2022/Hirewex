function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-8 w-48" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-28 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Sk className="h-4 w-28" />
            <Sk className="h-8 w-16" />
          </div>
        ))}
        <div className="rounded-xl border border-border bg-slate-900 p-5 space-y-3">
          <Sk className="h-4 w-32 bg-slate-700" />
          <Sk className="h-8 w-full rounded-lg bg-slate-700" />
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <Sk className="h-5 w-36" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg px-2 py-3">
            <div className="space-y-1.5">
              <Sk className="h-4 w-48" />
              <Sk className="h-3 w-32" />
            </div>
            <Sk className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

