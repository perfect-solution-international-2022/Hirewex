import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Ghost, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <Ghost className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
        Page not found
      </h1>
      
      <p className="mb-8 max-w-sm text-muted-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
      </p>

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        
        <Button asChild>
          <Link href="/service">
            Find Freelancers
          </Link>
        </Button>
      </div>
    </div>
  );
}