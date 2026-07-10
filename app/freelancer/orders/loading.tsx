function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card px-4 py-2.5 space-y-1.5 min-w-[110px]">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <Skeleton className="h-10 w-full md:w-96 rounded-lg" />
      </div>

      {/* Order cards */}
      <div className="grid gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 flex gap-4 items-start">
            <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-24 rounded-lg shrink-0 self-center" />
          </div>
        ))}
      </div>
    </div>
  );
}
