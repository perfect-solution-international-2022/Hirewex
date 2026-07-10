function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="flex w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 border-r border-border bg-card shrink-0">
        <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3">
          <Sk className="h-5 w-24" />
          <Sk className="h-8 w-full rounded-lg" />
        </div>
        <div className="flex-1 divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Sk className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-24" />
                <Sk className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat pane */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
          <Sk className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5">
            <Sk className="h-4 w-32" />
            <Sk className="h-3 w-40" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 py-6 space-y-4 bg-muted/10">
          {[false, true, false, false, true, false].map((isOwn, i) => (
            <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <Sk className={`h-10 rounded-2xl ${isOwn ? "w-48" : "w-56"}`} />
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-card p-4 flex items-center gap-2">
          <Sk className="h-10 flex-1 rounded-full" />
          <Sk className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </div>
    </div>
  );
}
