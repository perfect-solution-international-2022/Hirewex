function Sk({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="space-y-2 mb-8">
        <Sk className="h-9 w-48" />
        <Sk className="h-4 w-72" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8">
          {["Budget", "Categories", "Skill Level", "Project Scope"].map((s) => (
            <div key={s} className="space-y-3">
              <Sk className="h-5 w-28" />
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Sk className="h-4 w-32" />
                  <Sk className="h-4 w-8" />
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* Main feed */}
        <div className="flex-1 space-y-4">
          <Sk className="h-12 w-full rounded-lg" />
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 sm:p-8 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Sk className="h-6 w-6 rounded-full shrink-0" />
                      <Sk className="h-3.5 w-24" />
                    </div>
                    <Sk className="h-7 w-3/4" />
                  </div>
                  <Sk className="h-9 w-24 rounded-lg shrink-0" />
                </div>
                <div className="flex gap-6">
                  <Sk className="h-3.5 w-28" />
                  <Sk className="h-3.5 w-20" />
                </div>
                <div className="flex gap-6">
                  <Sk className="h-4 w-32" />
                  <Sk className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Sk className="h-3.5 w-full" />
                  <Sk className="h-3.5 w-5/6" />
                  <Sk className="h-3.5 w-4/6" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[...Array(4)].map((_, j) => (
                    <Sk key={j} className="h-7 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
