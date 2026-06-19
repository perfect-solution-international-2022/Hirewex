'use client';

import { useEffect } from "react";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Card } from "@/components/ui/card";
import { Briefcase, MessagesSquare, Wallet, ShieldCheck } from "lucide-react";

export default function HowItWorksPage() {
  // Update browser document head title safely on the client
  useEffect(() => {
    document.title = "How it works — Hirewex";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-bold">How Hirewex works</h1>
        <p className="mt-3 text-lg text-muted-foreground">A simple, secure flow from job post to payout.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { icon: Briefcase, title: "1. Post or bid", desc: "Buyers describe the work. Freelancers send tailored bids." },
            { icon: MessagesSquare, title: "2. Collaborate", desc: "Chat, share files, and track milestones in one place." },
            { icon: Wallet, title: "3. Escrow", desc: "Buyer funds the project. Money is held safely until approval." },
            { icon: ShieldCheck, title: "4. Release & review", desc: "Approve work to release payment. Leave a review." },
          ].map((s, i) => (
            <Card key={i} className="p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}