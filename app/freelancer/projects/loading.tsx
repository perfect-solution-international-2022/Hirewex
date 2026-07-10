function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-9 w-36" />
          <Sk className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Sk className="h-4 w-40" />
          <Sk className="h-6 w-11 rounded-full" />
        </div>
      </div>

      {/* Tabs + Create button */}
      <div className="flex items-center justify-between border-b border-border pb-px gap-4">
        <div className="flex gap-1 overflow-x-auto">
          <Sk className="h-10 w-12 rounded-none shrink-0" />
          <Sk className="h-10 w-14 rounded-none shrink-0" />
          <Sk className="h-10 w-20 rounded-none shrink-0" />
          <Sk className="h-10 w-36 rounded-none shrink-0" />
          <Sk className="h-10 w-14 rounded-none shrink-0" />
          <Sk className="h-10 w-14 rounded-none shrink-0" />
          <Sk className="h-10 w-16 rounded-none shrink-0" />
        </div>
        <Sk className="h-9 w-44 rounded-lg shrink-0" />
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/10 flex items-center justify-between">
          <Sk className="h-4 w-32" />
          <Sk className="h-8 w-32 rounded-lg" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <Sk className="h-10 w-16 rounded-md shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-4 w-56" />
                <Sk className="h-3 w-28" />
              </div>
              <Sk className="h-5 w-24 rounded-full shrink-0" />
              <div className="flex gap-2 shrink-0">
                <Sk className="h-8 w-16 rounded-lg" />
                <Sk className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

