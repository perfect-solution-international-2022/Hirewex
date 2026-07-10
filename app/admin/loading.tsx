function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-8 w-44" />
          <Sk className="h-4 w-60" />
        </div>
        <Sk className="h-9 w-36 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Sk className="h-4 w-28" />
              <Sk className="h-8 w-8 rounded-full" />
            </div>
            <Sk className="h-9 w-20" />
            <Sk className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <Sk className="h-5 w-40" />
          <Sk className="h-3.5 w-56" />
          <Sk className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Sk className="h-5 w-32" />
          <Sk className="h-44 w-full rounded-lg" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Sk className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Sk className="h-3 flex-1" />
                <Sk className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <Sk className="h-5 w-40" />
            <Sk className="h-4 w-20" />
          </div>
          <div className="divide-y divide-border">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sk className="h-5 w-16 rounded-full" />
                  <Sk className="h-3.5 w-48" />
                </div>
                <div className="flex items-center gap-3">
                  <Sk className="h-4 w-16" />
                  <Sk className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <Sk className="h-5 w-32" />
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border px-3 py-2.5 flex items-center gap-3">
                <Sk className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <Sk className="h-3.5 w-28" />
                  <Sk className="h-3 w-40" />
                </div>
                <Sk className="h-4 w-4 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
