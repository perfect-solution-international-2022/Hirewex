function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-9 w-36" />
          <Sk className="h-4 w-56" />
        </div>
        <Sk className="h-7 w-14 rounded-full" />
      </div>

      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Sk className="h-5 w-16 rounded-full" />
                <Sk className="h-5 w-24 rounded-full" />
                <Sk className="h-4 w-28" />
              </div>
              <Sk className="h-7 w-3/4" />
              <div className="flex items-center gap-2">
                <Sk className="h-7 w-7 rounded-full" />
                <Sk className="h-3.5 w-32" />
              </div>
              <div className="flex gap-4">
                <Sk className="h-4 w-20" />
                <Sk className="h-4 w-24" />
                <Sk className="h-4 w-32" />
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Sk className="h-9 w-28 rounded-lg" />
              <Sk className="h-9 w-28 rounded-lg" />
              <Sk className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
