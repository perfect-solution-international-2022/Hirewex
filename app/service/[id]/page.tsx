import { db } from "@/lib/db";
import { freelancerServices, users, profiles, reviews, serviceOrders } from "@/drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Check, MapPin, Globe, Clock, User, BadgeCheck, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceGallery } from "./ServiceGallery";
import { PricingSidebar } from "./PricingSidebar";
import { WriteReviewForm } from "./WriteReviewForm";
import Link from "next/link";
import { auth } from "@/auth";
import { createOrGetConversation } from "@/app/actions/chat";

const formatPrice = (price: string | number) => {
  if (!price) return "0";
  return Number(price).toLocaleString();
};

export default async function ServiceDetailsPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const serviceId = resolvedParams.id; // <-- WE ARE USING THIS GUARANTEED ID

  const session = await auth();
  const currentUserId = session?.user?.id;

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

  const isOwner = currentUserId === service.freelancerId;

  const reviewerAlias = aliasedTable(users, "reviewer");

  // Fetch reviews with real reviewer info
  const freelancerReviews = await db
    .select({
      id:             reviews.id,
      rating:         reviews.rating,
      comment:        reviews.comment,
      createdAt:      reviews.createdAt,
      reviewerName:   reviewerAlias.displayName,
      reviewerFallback: reviewerAlias.name,
      reviewerAvatar: reviewerAlias.avatarUrl,
    })
    .from(reviews)
    .innerJoin(reviewerAlias, eq(reviews.reviewerId, reviewerAlias.id))
    .where(eq(reviews.revieweeId, user.id))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  // Check if the current buyer has a paid order for this service and whether they've reviewed
  let buyerOrderId: string | null = null;
  let buyerExistingReview: { rating: number; comment: string | null } | null = null;

  if (currentUserId && !isOwner) {
    const [buyerOrder] = await db
      .select({ id: serviceOrders.id })
      .from(serviceOrders)
      .where(and(
        eq(serviceOrders.buyerId, currentUserId),
        eq(serviceOrders.serviceId, serviceId),
        eq(serviceOrders.status, "paid"),
      ))
      .limit(1);

    if (buyerOrder) {
      buyerOrderId = buyerOrder.id;
      const [existingReview] = await db
        .select({ rating: reviews.rating, comment: reviews.comment })
        .from(reviews)
        .where(and(eq(reviews.serviceOrderId, buyerOrder.id), eq(reviews.reviewerId, currentUserId)))
        .limit(1);
      if (existingReview) buyerExistingReview = existingReview;
    }
  }

  const displayName = user.displayName || user.name || "Freelancer";
  const headline = profile?.headline || user.title || service.category;
  const avatar = profile?.avatarUrl || user.image || user.avatarUrl || "";
  const rating = profile?.rating ? Number(profile.rating).toFixed(1) : "5.0";
  const reviewCount = profile?.totalReviews || 0;

  const allFeatures = Array.from(new Set([
    ...(packages.basic?.features || []),
    ...(packages.standard?.features || []),
    ...(packages.premium?.features || [])
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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="border-b border-border/40 bg-muted/20">
        <div className="container mx-auto px-4 py-3 text-xs font-medium text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/service" className="hover:text-foreground transition-colors">
              Find services
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{service.category}</span>
          </div>
          
          {isOwner && (
            <Link href={`/freelancer/edit-project/${serviceId}`} className="flex items-center gap-1.5 text-primary hover:underline font-semibold">
              <Edit className="h-3.5 w-3.5" /> Edit Service
            </Link>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

          <div className="lg:w-2/3 flex flex-col gap-10">

            <div className="space-y-5">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                {service.title}
                {isOwner && (
                  <span className="ml-3 inline-flex align-middle items-center bg-primary/10 text-primary text-[11px] px-2.5 py-1 rounded-sm uppercase tracking-wide font-bold">
                    Yours
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
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

                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">{rating}</span>
                    <span className="text-muted-foreground">({reviewCount} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <ServiceGallery images={images} />

            <section>
              <h2 className="text-xl font-bold mb-4 pb-3 border-b border-border/50">About this service</h2>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {service.description}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border/50">About {displayName}</h2>

              <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 border-b border-border/50">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20 shrink-0">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="bg-primary/10 text-2xl font-light text-primary">
                      {displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold">{displayName}</h3>
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        <BadgeCheck className="h-3 w-3" /> Top Rated
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{headline}</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{rating}</span>
                      <span className="text-muted-foreground">({reviewCount} reviews)</span>
                    </div>
                  </div>
                  {!isOwner && (
                    <form action={async () => {
                      "use server";
                      await createOrGetConversation(service.freelancerId, "seller", serviceId, "service");
                    }}>
                      <Button type="submit" variant="outline" size="sm" className="shrink-0">
                        Message
                      </Button>
                    </form>
                  )}
                </div>

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

                {(user.aboutText || profile?.bio) && (
                  <div className="px-6 py-5 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {user.aboutText || profile?.bio}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-5 pb-3 border-b border-border/50">Compare packages</h2>
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="p-4 border-b border-r border-border/60 w-[30%] font-medium text-muted-foreground text-xs uppercase tracking-wide">Feature</th>
                      {(["basic", "standard", "premium"] as const).map((tier) => (
                        <th key={tier} className="p-4 border-b border-r last:border-r-0 border-border/60 w-[23%]">
                          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 font-medium capitalize">{tier}</div>
                          <div className="text-lg font-bold text-foreground">USD {formatPrice(packages[tier]?.price)}</div>
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

            <section className="mb-12 space-y-6">
              <h2 className="text-xl font-bold pb-3 border-b border-border/50 flex items-center gap-2">
                Reviews
                <span className="text-base font-normal text-muted-foreground">({reviewCount})</span>
              </h2>

              {/* Write a review — only for buyers who have a paid order */}
              {buyerOrderId && (
                <WriteReviewForm
                  serviceOrderId={buyerOrderId}
                  revieweeId={user.id}
                  freelancerName={displayName}
                  freelancerAvatar={avatar}
                  serviceTitle={service.title}
                  alreadyReviewed={!!buyerExistingReview}
                  myReview={buyerExistingReview}
                />
              )}

              {freelancerReviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
                  <p className="text-sm text-muted-foreground">{buyerOrderId ? "You'll be the first to leave a review!" : "No reviews yet — be the first!"}</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {freelancerReviews.map((review) => {
                    const rName = review.reviewerName || review.reviewerFallback || "Buyer";
                    return (
                      <div key={review.id} className="py-6 first:pt-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.reviewerAvatar ?? ""} />
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {rName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-sm text-foreground">{rName}</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>

          <div className="lg:w-1/3 hidden lg:block">
            <PricingSidebar 
              packages={service.packages} 
              freelancerId={service.freelancerId}
              serviceId={serviceId} // <--- GUARANTEED FIXED HERE
              isOwner={currentUserId === service.freelancerId} 
            />
          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}