import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation"; // <-- Added for the admin intercept
import { auth } from "@/auth"; // <-- Using server-side auth
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader"; // Make sure SiteFooter is exported from here or adjust import
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  Briefcase, 
  Code, 
  Palette, 
  PenLine, 
  TrendingUp, 
  Video, 
  Brain, 
  BarChart3, 
  Smartphone, 
  ShieldCheck, 
  Wallet, 
  MessagesSquare, 
  Star, 
  CheckCircle2,
  Sparkles,
  Users,
  Zap
} from "lucide-react";

const categories = [
  { name: "Web Development", slug: "web-development", icon: Code },
  { name: "Mobile Apps", slug: "mobile-development", icon: Smartphone },
  { name: "Design & Creative", slug: "design-creative", icon: Palette },
  { name: "Writing", slug: "writing-translation", icon: PenLine },
  { name: "Marketing & SEO", slug: "marketing-seo", icon: TrendingUp },
  { name: "Video & Animation", slug: "video-animation", icon: Video },
  { name: "Data & Analytics", slug: "data-analytics", icon: BarChart3 },
  { name: "AI & ML", slug: "ai-ml", icon: Brain },
];

export default async function HomePage() {
  // Grab the session directly on the server (No hydration mismatch!)
  const session = await auth();

  // --- FRONT DOOR ADMIN INTERCEPT ---
  // If the logged-in user is an admin, instantly bounce them to their dashboard
  const isAdmin = session?.user?.roles?.includes("admin");
  if (isAdmin) {
    redirect("/admin");
  }
  // ----------------------------------

  // Smart links: if logged in, go to the actual page. If logged out, go to sign up as a buyer.
  const postProjectHref = session ? "/post-projects" : "/auth?mode=signup&role=buyer";
  const hireFreelancerHref = session ? "/service" : "/auth?mode=signup&role=buyer";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 36s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-marquee { animation: none; }
          }
        `}</style>

        {/* Base gradient */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />

        {/* Soft glow behind the proof card */}
        <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[110px]" />

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Trusted by 50k+ freelancers worldwide
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                Where great work{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">gets done.</span>
                  <span
                    className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-primary/15"
                    aria-hidden="true"
                  />
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Hirewex connects buyers with vetted freelancers across web, design, marketing and more. Secure escrow, real reviews, and zero hassle.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={hireFreelancerHref}>
                    Hire a freelancer<ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-background/80 backdrop-blur">
                  <Link href={postProjectHref}>
                    Post a Project
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified profiles</span>
                <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.9 avg rating</span>
              </div>
            </div>

            {/* Proof-of-work composition */}
            <div className="relative mx-auto w-full max-w-lg py-4">
              {/* Floating "bidding now" badge */}
              <div className="absolute -left-4 -top-6 z-30 hidden items-center gap-2 rounded-full border border-border bg-background py-2 pl-1.5 pr-4 shadow-[var(--shadow-elegant)] sm:flex">
                <div className="flex -space-x-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-primary/15 text-xs font-semibold text-primary">JD</div>
                  <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-primary/25 text-xs font-semibold text-primary">MK</div>
                  <div className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-primary text-xs font-semibold text-primary-foreground">+9</div>
                </div>
                <span className="text-sm font-medium">bidding now</span>
              </div>

              {/* Back receipt, peeking out behind */}
              <Card className="absolute inset-x-8 -top-4 hidden rotate-6 p-6 opacity-60 shadow-[var(--shadow-card)] sm:block">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-tight">API integration</p>
                    <p className="font-mono text-base text-muted-foreground">$680.00</p>
                  </div>
                </div>
              </Card>

              {/* Front receipt, main */}
              <Card className="relative -rotate-1 p-8 shadow-[var(--shadow-elegant)] sm:-rotate-2">
                <div className="absolute right-5 top-5 rotate-6 rounded border-2 border-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  Paid
                </div>

                <div className="flex items-center gap-4 pr-16">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <Palette className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold leading-tight">Brand identity redesign</p>
                    <p className="text-sm text-muted-foreground">for TechFlow Inc.</p>
                  </div>
                </div>

                <div className="mt-7 flex items-end justify-between border-t border-dashed border-border pt-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Released from escrow</p>
                    <p className="font-mono text-3xl font-bold tracking-tight">$1,250.00</p>
                  </div>
                  <div className="flex gap-1 text-primary">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                </div>

                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  &quot;Delivered ahead of schedule and exactly on brief. Already hired them again.&quot;
                </p>
              </Card>
            </div>
          </div>

          {/* Category marquee */}
          <div className="mt-16 border-t border-border pt-6">
            <div
              className="overflow-hidden"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="flex w-max animate-marquee gap-10">
                {[...categories, ...categories].map((c, i) => (
                  <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
                    <c.icon className="h-4 w-4 text-primary" />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Browse by category</h2>
            <p className="mt-1.5 text-muted-foreground">Find the service you need across every discipline.</p>
          </div>
          <Link href="/service" className="hidden text-sm font-medium text-primary hover:underline md:inline">
            All Services →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => (
            <Card
              key={c.slug}
              className="group cursor-pointer p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{c.name}</h3>
              <p className="mt-1 inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-primary">
                Explore freelancers
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Simple process
            </div>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">How Hirewex works</h2>
            <p className="mt-3 text-muted-foreground">From posting to payment, we keep it simple and secure.</p>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            {/* connecting line on desktop */}
            <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-border md:block" />

            {[
              { icon: Briefcase, title: "Post or find a job", desc: "Buyers describe their need. Freelancers discover and bid in seconds." },
              { icon: MessagesSquare, title: "Collaborate", desc: "Built-in chat, milestones, and file sharing keep projects on track." },
              { icon: Wallet, title: "Pay safely", desc: "Funds are held and released when you approve the work." },
            ].map((s, i) => (
              <Card key={i} className="relative p-6 shadow-[var(--shadow-card)]">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="absolute right-5 top-5 text-3xl font-bold text-muted-foreground/15">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="relative overflow-hidden border-border p-10 md:p-16" style={{ background: "var(--gradient-hero)" }}>
          <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />

          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-bold md:text-4xl">Ready to get started?</h2>
            <p className="mt-3 text-muted-foreground">Join thousands building their business on Hirewex.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link href={session ? "/freelancer" : "/auth?mode=signup"}>
                  {session ? "Go to Dashboard" : "Create your account"}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-background/80 backdrop-blur">
                <Link href="/how-it-works">
                  Learn more
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <SiteFooter />
    </div>
  );
}