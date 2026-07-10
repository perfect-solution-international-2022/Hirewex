function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-9 w-44" />
          <Sk className="h-4 w-60" />
        </div>
        <Sk className="h-7 w-16 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <Sk className="h-10 w-10 rounded-none" />
        <Sk className="h-10 w-16 rounded-none" />
        <Sk className="h-10 w-20 rounded-none" />
        <Sk className="h-10 w-20 rounded-none" />
      </div>

      {/* Bid cards */}
      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Sk className="h-5 w-20 rounded-full" />
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
                <Sk className="h-4 w-28" />
              </div>
              <Sk className="h-20 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Sk className="h-9 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

