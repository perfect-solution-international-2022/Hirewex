export const revalidate = 300; // revalidate every 5 minutes

import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { freelancerServices, users, profiles } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn } from "@/components/FadeIn";
import { HeroSearch } from "@/components/HeroSearch";
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirewex.com";

export const metadata: Metadata = {
  title: "Hirewex — Hire Top Freelancers Online | Freelance Marketplace",
  description:
    "Hirewex is a trusted freelance marketplace. Hire verified web developers, designers, marketers, writers and more. Secure escrow payments and real verified reviews.",
  keywords: [
    "hire freelancers online", "freelance marketplace", "best freelance platform",
    "hire web developer", "hire graphic designer", "hire copywriter",
    "hire SEO expert", "outsource work", "remote freelancers",
    "post a job online", "find freelance work", "freelance jobs",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    url: SITE_URL,
    title: "Hirewex — Hire Top Freelancers Online",
    description: "Find and hire verified freelancers for any skill. Secure escrow, real reviews, zero hassle.",
  },
};
import {
  ArrowRight, Star, CheckCircle2, Code, Palette, PenLine,
  TrendingUp, Video, Brain, BarChart3, Smartphone,
  Wallet, MessagesSquare, Zap, Users, ShieldCheck,
  Search, Briefcase, Globe, Award,
} from "lucide-react";


/* ────────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────────── */
const categories = [
  { name: "Web Development",   slug: "web-development",      icon: Code,       from: "from-blue-500",   to: "to-indigo-600" },
  { name: "Mobile Apps",       slug: "mobile-development",   icon: Smartphone, from: "from-violet-500", to: "to-purple-600" },
  { name: "Design & Creative", slug: "design-creative",      icon: Palette,    from: "from-pink-500",   to: "to-rose-600" },
  { name: "Writing",           slug: "writing-translation",  icon: PenLine,    from: "from-emerald-500",to: "to-teal-600" },
  { name: "Marketing & SEO",   slug: "marketing-seo",        icon: TrendingUp, from: "from-orange-500", to: "to-amber-600" },
  { name: "Video & Animation", slug: "video-animation",      icon: Video,      from: "from-red-500",    to: "to-rose-600" },
  { name: "Data & Analytics",  slug: "data-analytics",       icon: BarChart3,  from: "from-sky-500",    to: "to-blue-600" },
  { name: "AI & ML",           slug: "ai-ml",                icon: Brain,      from: "from-purple-500", to: "to-violet-600" },
];

const steps = [
  { icon: Search,        num: "01", title: "Post or discover",     desc: "Describe your project or browse vetted freelancers across 100+ categories." },
  { icon: MessagesSquare,num: "02", title: "Collaborate in-app",   desc: "Chat, share files, and track milestones all inside Hirewex — zero friction." },
  { icon: Wallet,        num: "03", title: "Pay when satisfied",   desc: "Funds are held in escrow and released only when you approve the final work." },
];

const stats = [
  { value: "50k+",  label: "Freelancers",     icon: Users },
  { value: "98%",   label: "Satisfaction rate",icon: Star },
  { value: "4.9★",  label: "Average rating",  icon: Award },
  { value: "24/7",  label: "Support",          icon: Globe },
];

const testimonials = [
  { name: "Sarah K.",   role: "Startup Founder",      body: "Found a developer in under 2 hours. Delivered perfectly, on budget. Hirewex is our go-to for every project now.", rating: 5, initials: "SK" },
  { name: "James L.",   role: "Marketing Director",   body: "The escrow system gave us peace of mind. Quality was outstanding across all three freelancers we hired.", rating: 5, initials: "JL" },
  { name: "Priya M.",   role: "E-commerce Owner",     body: "Cut our design costs by 60% without sacrificing quality. The review system helps you pick the right talent fast.", rating: 5, initials: "PM" },
];


/* ────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await auth();

  const isAdmin = session?.user?.roles?.includes("admin");
  if (isAdmin) redirect("/admin");

  const postProjectHref    = session ? "/post-projects"  : "/auth?mode=signup&role=buyer";
  const hireFreelancerHref = session ? "/service"        : "/auth?mode=signup&role=buyer";
  const freelancerHref     = session ? "/freelancer"     : "/auth?mode=signup&role=freelancer";

  // Fetch approved services for the featured section
  const featuredServices = await db
    .select({
      service: freelancerServices,
      seller:  users,
      profile: profiles,
    })
    .from(freelancerServices)
    .innerJoin(users,    eq(freelancerServices.freelancerId, users.id))
    .leftJoin(profiles,  eq(users.id, profiles.id))
    .where(and(
      eq(freelancerServices.status, "approved"),
    ))
    .orderBy(desc(freelancerServices.createdAt))
    .limit(6);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Hirewex",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "description": "Hirewex is a trusted freelance marketplace connecting businesses with vetted freelancers worldwide.",
    "sameAs": [],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Hirewex",
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": { "@type": "EntryPoint", "urlTemplate": `${SITE_URL}/service?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <SiteHeader />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .animate-marquee { animation: marquee 36s linear infinite; }
          @media (prefers-reduced-motion: reduce) { .animate-marquee { animation: none; } }
        `}</style>

        {/* Base gradient */}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        {/* Soft glow */}
        <div className="pointer-events-none absolute right-0 top-1/4 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[110px]" />

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            {/* ── Left: copy + search ── */}
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Trusted by 50k+ freelancers worldwide
                </div>
              </FadeIn>

              <FadeIn delay={80}>
                <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
                  Where great work{" "}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-primary">gets done.</span>
                    <span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-primary/15" aria-hidden="true" />
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={140}>
                <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                  Hirewex connects buyers with vetted freelancers across web, design, marketing and more. Secure escrow, real reviews, and zero hassle.
                </p>
              </FadeIn>

              {/* Search bar */}
              <FadeIn delay={200}>
                <HeroSearch hireHref={hireFreelancerHref} />
              </FadeIn>

              {/* Secondary CTA + trust */}
              <FadeIn delay={260}>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="default" variant="outline" asChild className="bg-background/80 backdrop-blur">
                    <Link href={postProjectHref}>Post a Project</Link>
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Verified profiles</span>
                  <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.9 avg rating</span>
                </div>
              </FadeIn>
            </div>

            {/* ── Right: proof-of-work cards ── */}
            <FadeIn delay={120} direction="right">
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

                {/* Back receipt */}
                <div className="absolute inset-x-8 -top-4 hidden rotate-6 rounded-xl border border-border bg-card p-6 opacity-60 shadow-[var(--shadow-card)] sm:block">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                      <Code className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold leading-tight">API integration</p>
                      <p className="font-mono text-base text-muted-foreground">$680.00</p>
                    </div>
                  </div>
                </div>

                {/* Front receipt */}
                <div className="relative -rotate-1 rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] sm:-rotate-2">
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
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
                    </div>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    &quot;Delivered ahead of schedule and exactly on brief. Already hired them again.&quot;
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Category marquee */}
          <div className="mt-16 border-t border-border pt-6">
            <div className="overflow-hidden"
              style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}>
              <div className="flex w-max animate-marquee gap-10">
                {[...categories, ...categories].map((c, i) => (
                  <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-muted-foreground">
                    <c.icon className="h-4 w-4 text-primary" /> {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 divide-y divide-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={s.label} delay={i * 60}>
                  <div className="flex flex-col items-center gap-1 py-8 text-center px-4">
                    <Icon className="h-5 w-5 text-primary mb-1" />
                    <p className="text-2xl md:text-3xl font-extrabold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Browse by category</p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Explore every skill set</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">From code to creative, find expertise across every discipline.</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <FadeIn key={c.slug} delay={i * 50}>
                <Link href={`/service?category=${c.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:border-transparent block">
                  <div className={`absolute inset-0 bg-gradient-to-br ${c.from} ${c.to} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.from} ${c.to} text-white shadow-sm mb-4 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm md:text-base text-foreground group-hover:text-white transition-colors leading-tight">{c.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-white/80 transition-colors">
                      Explore <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn delay={200}>
          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link href="/service" className="gap-2">
                Browse all services <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border bg-muted/20 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)", backgroundSize: "40px 40px" }} />

        <div className="container relative mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Simple process</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">How Hirewex works</h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">From posting to payment in three simple steps.</p>
            </div>
          </FadeIn>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* connector line */}
            <div className="pointer-events-none absolute left-0 right-0 top-[26px] hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <FadeIn key={s.num} delay={i * 120}>
                  <div className="relative rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-[0_0_20px_var(--color-primary-glow,rgba(23,160,85,0.3))]">
                      {s.num}
                    </div>
                    <Icon className="absolute right-6 top-6 h-5 w-5 text-muted-foreground/30" />
                    <h3 className="text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED SERVICES ────────────────────────────────────────── */}
      {featuredServices.length > 0 && (
        <section className="container mx-auto px-4 py-20 md:py-28">
          <FadeIn>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Top talent</p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Featured services</h2>
                <p className="mt-2 text-muted-foreground">Hand-picked from our top-rated freelancers.</p>
              </div>
              <Link href="/service" className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map(({ service, seller, profile }, i) => {
              const name    = seller.displayName || seller.name || "Freelancer";
              const avatar  = profile?.avatarUrl || seller.image || seller.avatarUrl || "";
              const rating  = profile?.rating ? Number(profile.rating).toFixed(1) : null;
              const reviews = profile?.totalReviews || 0;
              const images  = (service.images as string[] | null) || [];
              const packages = service.packages as any;
              const price   = packages?.basic?.price || packages?.standard?.price || packages?.premium?.price || "—";

              return (
                <FadeIn key={service.id} delay={i * 80}>
                  <Link href={`/service/${service.id}`}
                    className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {images[0] ? (
                        <img src={images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Briefcase className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      {service.category && (
                        <span className="absolute top-3 left-3 rounded-lg bg-background/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground">
                          {service.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={avatar} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-foreground truncate">{name}</span>
                        {rating && (
                          <span className="ml-auto flex items-center gap-0.5 text-[11px] font-bold text-amber-500 shrink-0">
                            <Star className="h-3 w-3 fill-amber-400" /> {rating}
                            {reviews > 0 && <span className="text-muted-foreground font-normal">({reviews})</span>}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">{service.title}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Starting at</span>
                        <span className="text-base font-extrabold text-primary">USD {Number(price).toLocaleString()}</span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={200}>
            <div className="mt-8 text-center md:hidden">
              <Button variant="outline" asChild>
                <Link href="/service">View all services</Link>
              </Button>
            </div>
          </FadeIn>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/10 to-muted/30" />
        <div className="container relative mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Don&apos;t take our word for it</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Loved by thousands of businesses</h2>
            </div>
          </FadeIn>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <FadeIn key={t.name} delay={i * 100}>
                <div className="rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">&ldquo;{t.body}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 pt-5 border-t border-border/50">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ──────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
          <FadeIn direction="left">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Why Hirewex</p>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-snug">
                Everything you need, nothing you don&apos;t.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We built Hirewex because hiring shouldn&apos;t feel like a gamble. Every feature — from smart matching to escrow payments — is designed to protect both sides.
              </p>
            </div>
          </FadeIn>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "KYC-verified profiles",   desc: "Every freelancer is identity-verified before they can take on projects." },
              { icon: Wallet,      title: "Secure escrow payments",  desc: "Funds are locked until you approve — zero risk to your budget." },
              { icon: Star,        title: "Genuine reviews only",    desc: "Reviews are gated to buyers with completed, paid orders." },
              { icon: Zap,         title: "Fast matching",           desc: "Post a job and get bids from qualified freelancers in minutes." },
            ].map((v, i) => {
              const Icon = v.icon;
              return (
                <FadeIn key={v.title} delay={i * 80} direction="right">
                  <div className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-sm mb-1">{v.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FREELANCER CTA ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-50/30 dark:to-emerald-950/10" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[120px]" />

        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <FadeIn direction="left">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">For freelancers</p>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Earn money on your own terms.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
                  Join 50,000+ freelancers who use Hirewex to find clients, showcase their work, and get paid fast — all without the chase.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "Set your own rates and hours",
                    "Get paid securely via escrow",
                    "Build your reputation with verified reviews",
                  ].map((p) => (
                    <li key={p} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <Link href={freelancerHref} className="gap-2">
                      Start freelancing <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeIn>

            {/* Visual grid of freelancer stats */}
            <FadeIn direction="right" delay={100}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Avg monthly earnings", value: "$3,200",  accent: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Projects per month",    value: "12+",     accent: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Days to first client",  value: "≤ 3",     accent: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
                  { label: "Platform fee",          value: "Low %",   accent: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/20" },
                ].map((s, i) => (
                  <div key={s.label} className={`rounded-2xl border border-border ${s.bg} p-6`}>
                    <p className={`text-3xl font-extrabold ${s.accent}`}>{s.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground font-medium">{s.label}</p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-600 p-10 md:p-16 text-center">
            {/* Noise / blob overlay */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-[80px]" />

            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-4">Get started today</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to build<br className="hidden md:block" /> something great?
              </h2>
              <p className="mt-4 text-white/80 text-lg max-w-xl mx-auto">
                Join thousands of businesses and freelancers already growing with Hirewex.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-lg" asChild>
                  <Link href={session ? "/service" : "/auth?mode=signup"}>
                    {session ? "Find a freelancer" : "Get started free"}
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 backdrop-blur" asChild>
                  <Link href={postProjectHref}>Post a project</Link>
                </Button>
              </div>
              <p className="mt-5 text-sm text-white/60">No credit card required · Free to post a project</p>
            </div>
          </div>
        </FadeIn>
      </section>

      <SiteFooter />
    </div>
  );
}
