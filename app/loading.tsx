function Sk({ className }: { className?: string }) {
  return <div className={`skeleton ${className ?? ""}`} />;
}

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="border-b py-20 md:py-28">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Sk className="h-7 w-32 rounded-full" />
            <div className="space-y-3">
              <Sk className="h-14 w-full" />
              <Sk className="h-14 w-4/5" />
            </div>
            <Sk className="h-5 w-3/4" />
            <Sk className="h-14 w-full rounded-xl" />
            <Sk className="h-10 w-40 rounded-lg" />
            <div className="flex gap-6">
              <Sk className="h-4 w-28" />
              <Sk className="h-4 w-28" />
            </div>
          </div>
          <div className="hidden lg:block relative h-80">
            <Sk className="absolute inset-0 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Sk className="h-8 w-24" />
              <Sk className="h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4 space-y-10">
          <div className="space-y-3 text-center">
            <Sk className="h-6 w-24 mx-auto rounded-full" />
            <Sk className="h-9 w-64 mx-auto" />
            <Sk className="h-4 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border p-5 md:p-6 space-y-3">
                <Sk className="h-11 w-11 rounded-xl" />
                <Sk className="h-4 w-28" />
                <Sk className="h-3 w-16" />
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Sk className="h-10 w-44 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Featured services */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Sk className="h-7 w-48" />
              <Sk className="h-4 w-64" />
            </div>
            <Sk className="h-4 w-16" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden">
                <Sk className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sk className="h-6 w-6 rounded-full shrink-0" />
                    <Sk className="h-3 w-24" />
                    <Sk className="h-3 w-12 ml-auto" />
                  </div>
                  <Sk className="h-4 w-full" />
                  <Sk className="h-4 w-3/4" />
                  <div className="flex justify-between pt-1">
                    <Sk className="h-3 w-16" />
                    <Sk className="h-4 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

