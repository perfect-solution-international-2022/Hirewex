function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-12">
      <Sk className="h-9 w-52 mb-8" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div className="space-y-2">
              <Sk className="h-3 w-28" />
              <Sk className="h-6 w-64" />
              <div className="flex items-center gap-2">
                <Sk className="h-5 w-20 rounded-full" />
                <Sk className="h-3 w-1.5 rounded-full" />
                <Sk className="h-3.5 w-28" />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Sk className="h-7 w-20" />
              <Sk className="h-6 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

