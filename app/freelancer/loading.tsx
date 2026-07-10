function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-8 w-56" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-9 w-32 rounded-lg" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Sk className="h-4 w-24" />
              <Sk className="h-4 w-4 rounded-sm" />
            </div>
            <Sk className="h-8 w-16" />
            <Sk className="h-3 w-32" />
          </div>
        ))}
        <div className="rounded-xl border border-border bg-slate-900 p-5 space-y-3">
          <Sk className="h-10 w-10 rounded-full bg-slate-700 mx-auto" />
          <Sk className="h-4 w-32 bg-slate-700 mx-auto" />
          <Sk className="h-8 w-full rounded-lg bg-slate-700" />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <Sk className="h-5 w-40" />
          <Sk className="h-3 w-56" />
          <Sk className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Sk className="h-5 w-32" />
          <Sk className="h-44 w-full rounded-lg" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Sk className="h-2.5 w-2.5 rounded-full shrink-0" />
                <Sk className="h-3 flex-1" />
                <Sk className="h-3 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Sk className="h-5 w-24" />
          <Sk className="h-48 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Sk className="h-5 w-36" />
            <Sk className="h-4 w-16" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Sk className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Sk className="h-4 w-36" />
                  <Sk className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sk className="h-4 w-16" />
                <Sk className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active projects */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-1">
          <Sk className="h-5 w-36" />
          <Sk className="h-3.5 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-2">
              <Sk className="h-4 w-full" />
              <Sk className="h-3 w-24" />
              <Sk className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

