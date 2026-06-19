'use client';

import { useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Card } from "@/components/ui/card";

export default function BlogPage() {
  // Update browser document head title safely on the client
  useEffect(() => {
    document.title = "Blog — Hirewex";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold">Hirewex Blog</h1>
        <p className="mt-3 text-muted-foreground">Tips, stories, and updates from the freelance world.</p>
        <Card className="mt-10 p-10 text-center text-muted-foreground">
          No posts published yet. Check back soon!
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}