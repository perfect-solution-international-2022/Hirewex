"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const popularSearches = ["Logo Design", "WordPress", "React Developer", "Video Editing", "Copywriting", "SEO"];

export function HeroSearch({ hireHref }: { hireHref: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const q = query.trim();
    router.push(q ? `/service?q=${encodeURIComponent(q)}` : "/service");
  };

  return (
    <div className="mt-8 max-w-lg">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-background/90 p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for any skill or service…"
            className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <Button size="sm" className="rounded-xl px-5 shrink-0" onClick={handleSearch}>
          Search
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground font-medium">Popular:</span>
        {popularSearches.map((s) => (
          <Link
            key={s}
            href={`/service?q=${encodeURIComponent(s)}`}
            className="rounded-full border border-border bg-background/80 px-2.5 py-1 text-foreground/70 hover:border-primary hover:text-primary transition-colors backdrop-blur"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
