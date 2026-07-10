import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted border border-border">
            <FileQuestion className="h-9 w-9 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">404</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">Page not found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/service">Browse services</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}