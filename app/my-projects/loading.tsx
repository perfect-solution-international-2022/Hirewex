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
        <Sk className="h-9 w-36 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border overflow-x-auto">
        <Sk className="h-10 w-10 rounded-none" />
        <Sk className="h-10 w-16 rounded-none" />
        <Sk className="h-10 w-40 rounded-none" />
        <Sk className="h-10 w-52 rounded-none" />
        <Sk className="h-10 w-16 rounded-none" />
      </div>

      <div className="grid gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Sk className="h-6 w-48 font-bold" />
                <Sk className="h-5 w-16 rounded-full" />
                <Sk className="h-5 w-24 rounded-full" />
              </div>
              <div className="flex gap-4">
                <Sk className="h-3.5 w-28" />
                <Sk className="h-3.5 w-24" />
                <Sk className="h-3.5 w-20" />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Sk className="h-9 w-16 rounded-lg" />
              <Sk className="h-9 w-16 rounded-lg" />
              <Sk className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

