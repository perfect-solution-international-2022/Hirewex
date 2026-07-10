"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center bg-background">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="h-9 w-9 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-destructive uppercase tracking-widest mb-3">Something went wrong</p>
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Unexpected error</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        An error occurred while loading this page. Try refreshing — if the problem persists, contact support.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
      {error?.digest && (
        <p className="mt-6 text-[11px] text-muted-foreground/50 font-mono">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
