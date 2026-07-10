function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-2">
        <Sk className="h-8 w-32" />
        <Sk className="h-4 w-56" />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sk className="h-5 w-5 rounded-sm" />
              <Sk className="h-3 w-20" />
            </div>
            <Sk className="h-8 w-24" />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Withdrawal card */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Sk className="h-5 w-36" />
          <Sk className="h-16 w-full rounded-lg" />
          <Sk className="h-10 w-full rounded-lg" />
          <div className="flex gap-2">
            {["w-12", "w-12", "w-14", "w-12"].map((w, i) => (
              <Sk key={i} className={`h-8 ${w} rounded-full`} />
            ))}
          </div>
          <Sk className="h-10 w-full rounded-lg" />
        </div>

        {/* Pending requests */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Sk className="h-5 w-40" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/30 p-3 flex items-center justify-between">
              <Sk className="h-4 w-20" />
              <div className="flex items-center gap-2">
                <Sk className="h-3.5 w-20" />
                <Sk className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <Sk className="h-4 w-40" />
          <Sk className="h-3 w-20" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sk className="h-9 w-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Sk className="h-4 w-40" />
                  <Sk className="h-3 w-24" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Sk className="h-4 w-16" />
                <Sk className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
