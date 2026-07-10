function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left inbox panel */}
      <div className="w-full max-w-xs xl:max-w-sm border-r border-border flex flex-col shrink-0">
        <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <Sk className="h-5 w-24" />
            <Sk className="h-3.5 w-12" />
          </div>
          <Sk className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex-1 divide-y divide-border/40">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <Sk className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Sk className="h-3.5 w-28" />
                  <Sk className="h-3 w-10" />
                </div>
                <Sk className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/40">
          <Sk className="h-3 w-48 mx-auto" />
        </div>
      </div>

      {/* Right empty state */}
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Sk className="h-20 w-20 rounded-full" />
          <Sk className="h-5 w-40" />
          <Sk className="h-4 w-56" />
        </div>
      </div>
    </div>
  );
}

