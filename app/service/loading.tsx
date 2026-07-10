function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-[1400px]">
      <div className="space-y-2 mb-8">
        <Sk className="h-9 w-48" />
        <Sk className="h-4 w-72" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          {["Starting Price", "Categories"].map((s) => (
            <div key={s} className="space-y-4">
              <Sk className="h-5 w-32" />
              {s === "Starting Price" ? (
                <div className="flex items-center gap-2">
                  <Sk className="h-9 flex-1 rounded-lg" />
                  <Sk className="h-3 w-4" />
                  <Sk className="h-9 flex-1 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <Sk className="h-4 w-28" />
                      <Sk className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* Grid */}
        <div className="flex-1 space-y-6">
          <Sk className="h-12 w-full rounded-lg" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <Sk className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sk className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Sk className="h-3 w-20" />
                      <Sk className="h-2.5 w-14" />
                    </div>
                  </div>
                  <Sk className="h-4 w-full" />
                  <Sk className="h-4 w-3/4" />
                  <div className="flex justify-between pt-2 border-t border-border/50">
                    <Sk className="h-4 w-14" />
                    <Sk className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
