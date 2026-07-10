function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-9 w-52" />
          <Sk className="h-4 w-64" />
        </div>
        <Sk className="h-7 w-16 rounded-full" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Job header */}
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Sk className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Sk className="h-5 w-56" />
                  <div className="flex gap-3">
                    <Sk className="h-3.5 w-20" />
                    <Sk className="h-3.5 w-20" />
                    <Sk className="h-3.5 w-24" />
                  </div>
                </div>
              </div>
              <Sk className="h-4 w-4 rounded-sm shrink-0" />
            </div>

            {/* Bids expanded */}
            <div className="border-t divide-y divide-border">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="p-5 flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sk className="h-11 w-11 rounded-full" />
                      <div className="space-y-1">
                        <Sk className="h-4 w-32" />
                        <Sk className="h-3 w-20" />
                      </div>
                      <Sk className="h-5 w-20 rounded-full ml-auto" />
                    </div>
                    <div className="flex gap-4">
                      <Sk className="h-4 w-20" />
                      <Sk className="h-4 w-24" />
                      <Sk className="h-4 w-28" />
                    </div>
                    <Sk className="h-16 w-full rounded-lg" />
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Sk className="h-9 w-28 rounded-lg" />
                    <Sk className="h-9 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

