function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Sk className="h-9 w-40" />
          <Sk className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          {[["Money Held", "w-16"], ["Total Earned", "w-20"]].map(([, w], i) => (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-2.5 space-y-1.5 min-w-[110px]">
              <Sk className="h-2.5 w-20" />
              <Sk className={`h-6 ${w}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <Sk className="h-10 w-full md:w-96 rounded-lg" />
      </div>

      {/* Order cards */}
      <div className="grid gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <Sk className="h-14 w-20 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Sk className="h-4 w-48" />
                <Sk className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <Sk className="h-3.5 w-24" />
                <Sk className="h-4 w-4 rounded-full" />
                <Sk className="h-3.5 w-24" />
              </div>
              <Sk className="h-3.5 w-32" />
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <Sk className="h-6 w-20" />
              <Sk className="h-5 w-14 rounded-full" />
            </div>
            <Sk className="h-4 w-4 rounded-sm shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
