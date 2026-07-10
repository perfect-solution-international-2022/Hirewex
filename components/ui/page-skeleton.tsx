"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}

/** Full-page spinner — used in loading.tsx files for simple routes */
export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
    </div>
  );
}

/** Dashboard shell skeleton — mirrors DashboardShell layout */
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-5 w-36" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card grid skeleton — for /service, /jobs listing pages */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="container mx-auto px-4 py-12 max-w-[1400px]">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 shrink-0 space-y-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-28" />
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <Skeleton className="h-12 w-full mb-6 rounded-lg" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2.5 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chat inbox skeleton */
export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="w-full max-w-xs xl:max-w-sm border-r border-border flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="flex-1 divide-y divide-border/40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    </div>
  );
}

/** Simple list/table skeleton — for admin pages, bids, projects etc. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border/60 px-5 py-3 flex gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 flex-1" />)}
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex gap-4 border-b border-border/40 last:border-0">
            <Skeleton className="h-4 w-8 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
