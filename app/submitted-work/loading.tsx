function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Sk className="h-9 w-48" />
        <Sk className="h-4 w-64" />
      </div>

      <div className="flex gap-2">
        <Sk className="h-6 w-32 rounded-full" />
        <Sk className="h-6 w-32 rounded-full" />
      </div>

      {/* Awaiting Review section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sk className="h-5 w-36" />
          <Sk className="h-5 w-7 rounded-full" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Sk className="h-5 w-28 rounded-full" />
              <Sk className="h-5 w-24 rounded-full" />
            </div>
            <Sk className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Sk className="h-5 w-5 rounded-full" />
              <Sk className="h-3.5 w-48" />
            </div>
            <Sk className="h-24 w-full rounded-lg" />
            <div className="flex gap-2">
              <Sk className="h-9 w-24 rounded-lg" />
              <Sk className="h-9 w-32 rounded-lg" />
              <Sk className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Past Reviews section */}
      <div className="space-y-4">
        <Sk className="h-5 w-28" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Sk className="h-5 w-28 rounded-full" />
              <Sk className="h-5 w-20 rounded-full" />
            </div>
            <Sk className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Sk className="h-5 w-5 rounded-full" />
              <Sk className="h-3.5 w-48" />
            </div>
            <Sk className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
