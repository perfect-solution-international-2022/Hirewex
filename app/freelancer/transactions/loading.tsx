function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Sk className="h-9 w-36" />
          <Sk className="h-4 w-56" />
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 space-y-1.5 min-w-[120px]">
            <Sk className="h-2.5 w-24" />
            <Sk className="h-6 w-20" />
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2.5 space-y-1.5 min-w-[100px]">
            <Sk className="h-2.5 w-16" />
            <Sk className="h-6 w-16" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <Sk className="h-4 w-40" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["w-24", "w-full", "w-32"].map((w, i) => (
                <th key={i} className="px-5 py-3 text-left">
                  <Sk className={`h-3 ${w}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <tr key={i} className="hover:bg-muted/20">
                <td className="px-5 py-3.5"><Sk className="h-5 w-20" /></td>
                <td className="px-5 py-3.5"><Sk className="h-4 w-full max-w-xs" /></td>
                <td className="px-5 py-3.5 whitespace-nowrap"><Sk className="h-4 w-24" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

