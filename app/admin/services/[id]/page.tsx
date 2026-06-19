import { db } from "@/lib/db";
import { freelancerServices, users, profiles, reviews } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Check, MapPin, Globe, Clock, User, BadgeCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceGallery } from "@/app/service/[id]/ServiceGallery";
import Link from "next/link";

const formatPrice = (price: string | number) => {
  if (!price) return "0";
  return Number(price).toLocaleString();
};

export async function generateMetadata({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const [data] = await db
    .select({ service: freelancerServices })
    .from(freelancerServices)
    .where(eq(freelancerServices.id, resolvedParams.id));

  return {
    title: data ? `${data.service.title} — Admin Review` : "Service — Admin",
  };
}

export default async function AdminServiceDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const serviceId = resolvedParams.id;

  const [data] = await db
    .select({ service: freelancerServices, user: users, profile: profiles })
    .from(freelancerServices)
    .innerJoin(users, eq(freelancerServices.freelancerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(freelancerServices.id, serviceId));

  if (!data) notFound();

  const { service, user, profile } = data;
  const packages = service.packages as any;
  const images = (service.images as string[]) || [];

  const freelancerReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.revieweeId, user.id))
    .orderBy(desc(reviews.createdAt))
    .limit(5);

  const displayName = user.displayName || user.name || "Freelancer";
  const headline = profile?.headline || user.title || service.category;
  const avatar = profile?.avatarUrl || user.image || user.avatarUrl || "";
  const rating = profile?.rating ? Number(profile.rating).toFixed(1) : "5.0";
  const reviewCount = profile?.totalReviews || 0;

  const allFeatures = Array.from(new Set([
    ...(packages.basic?.features || []),
    ...(packages.standard?.features || []),
    ...(packages.premium?.features || []),
  ]));

  const checkFeature = (tier: "basic" | "standard" | "premium", feature: string) => {
    const basicList = packages.basic?.features || [];
    const standardList = packages.standard?.features || [];
    const premiumList = packages.premium?.features || [];
    if (tier === "basic") return basicList.includes(feature);
    if (tier === "standard") return standardList.includes(feature) || basicList.includes(feature);
    if (tier === "premium") return premiumList.includes(feature) || standardList.includes(feature) || basicList.includes(feature);
    return false;
  };

  return (
    <DashboardShell title="Service Review" role="admin">
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">

        {/* Back + meta breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/services"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>
          <Badge variant="outline" className="text-xs">
            {service.category || "Uncategorized"}
          </Badge>
        </div>

        {/* Title + freelancer summary */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground">
            {service.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarImage src={avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-foreground">{displayName}</span>
              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                <BadgeCheck className="h-3 w-3" /> Top Rated
              </span>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{rating}</span>
                <span className="text-muted-foreground">({reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <ServiceGallery images={images} />

        {/* About this service */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">About this service</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {service.description}
          </div>
        </section>

        {/* Packages summary (read-only, all 3 at a glance) */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">Packages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["basic", "standard", "premium"] as const).map((tier) => {
              const pkg = packages[tier];
              if (!pkg) return null;
              return (
                <div
                  key={tier}
                  className="rounded-xl border border-border/60 bg-card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground capitalize">
                      {tier}
                    </span>
                    <span className="text-base font-bold text-foreground">
                      LKR {formatPrice(pkg.price)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pkg.description}</p>
                  <ul className="mt-1 space-y-1">
                    {(pkg.features || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Compare packages table */}
        {allFeatures.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">Package comparison</h2>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-4 border-b border-r border-border/60 w-[34%] font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      Feature
                    </th>
                    {(["basic", "standard", "premium"] as const).map((tier) => (
                      <th key={tier} className="p-4 border-b border-r last:border-r-0 border-border/60">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium capitalize">
                          {tier}
                        </div>
                        <div className="text-base font-bold text-foreground">
                          LKR {formatPrice(packages[tier]?.price)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border/40">
                  {allFeatures.map((feature: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 border-r border-border/60 text-sm text-foreground">{feature}</td>
                      {(["basic", "standard", "premium"] as const).map((tier) => (
                        <td key={tier} className="p-4 border-r last:border-r-0 border-border/60 text-center">
                          {checkFeature(tier, feature)
                            ? <Check className="h-4 w-4 text-primary mx-auto" />
                            : <span className="block w-4 h-0.5 bg-border/60 mx-auto rounded-full" />
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Freelancer card */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">Freelancer</h2>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Top strip */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 border-b border-border/50">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 shrink-0">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary/10 text-2xl font-light text-primary">
                  {displayName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-base font-bold">{displayName}</h3>
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    <BadgeCheck className="h-3 w-3" /> Top Rated
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{headline}</p>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{rating}</span>
                  <span className="text-muted-foreground">({reviewCount} reviews)</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border/50 text-sm">
              {[
                { icon: MapPin, label: "From", value: profile?.country || user.location || "Unknown" },
                { icon: User, label: "Member since", value: new Date(user.createdAt).getFullYear() },
                { icon: Globe, label: "Languages", value: user.language || "English" },
                { icon: Clock, label: "Response time", value: "~1 hour" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col gap-0.5 px-5 py-4">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {/* Bio */}
            {(user.aboutText || profile?.bio) && (
              <div className="px-6 py-5 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {user.aboutText || profile?.bio}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50 flex items-center gap-2">
            Reviews
            <span className="text-sm font-normal text-muted-foreground">({reviewCount})</span>
          </h2>

          {freelancerReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-0 divide-y divide-border/50">
              {freelancerReviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">R</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm text-foreground">Reviewer</div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}
