import { db } from "@/lib/db";
import { users, profiles, freelancerSkills, freelancerWorkExperiences, reviews, freelancerServices } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { ProfilePreviewClient } from "./ProfilePreviewClient";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirewex.com";

export async function generateMetadata({ params }: { params: { freelancerId: string } }) {
  const { freelancerId } = await params;
  const [user] = await db
    .select({
      name: users.name,
      displayName: users.displayName,
      title: users.title,
      avatarUrl: users.avatarUrl,
      aboutText: users.aboutText,
    })
    .from(users)
    .where(eq(users.id, freelancerId));

  if (!user) return { title: "Freelancer Profile — Hirewex" };

  const displayName = user.displayName || user.name || "Freelancer";
  const headline = user.title || "Freelancer";
  const desc = user.aboutText
    ? user.aboutText.slice(0, 155) + (user.aboutText.length > 155 ? "…" : "")
    : `Hire ${displayName} — ${headline} on Hirewex. View portfolio, reviews and services.`;
  const avatar = user.avatarUrl ?? `${SITE_URL}/og-default.png`;

  return {
    title: `${displayName} — ${headline}`,
    description: desc,
    keywords: [displayName, headline, "hire freelancer", "freelancer profile", "Hirewex"],
    openGraph: {
      title: `${displayName} — Freelancer on Hirewex`,
      description: desc,
      url: `${SITE_URL}/profile-preview/${freelancerId}`,
      type: "profile",
      images: [{ url: avatar, width: 400, height: 400, alt: displayName }],
    },
    twitter: {
      card: "summary",
      title: `${displayName} — Freelancer on Hirewex`,
      description: desc,
      images: [avatar],
    },
    alternates: { canonical: `${SITE_URL}/profile-preview/${freelancerId}` },
  };
}

export default async function ProfilePreviewPage({ params }: { params: { freelancerId: string } }) {
  const resolvedParams = await params;
  const freelancerId = resolvedParams.freelancerId;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, freelancerId));

  if (!user) notFound();

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, freelancerId));

  const skills = await db
    .select()
    .from(freelancerSkills)
    .where(eq(freelancerSkills.userId, freelancerId));

  const workExperiences = await db
    .select()
    .from(freelancerWorkExperiences)
    .where(eq(freelancerWorkExperiences.userId, freelancerId));

  const reviewerAlias = aliasedTable(users, "reviewer");
  const userReviews = await db
    .select({
      id:               reviews.id,
      rating:           reviews.rating,
      comment:          reviews.comment,
      createdAt:        reviews.createdAt,
      reviewerName:     reviewerAlias.displayName,
      reviewerFallback: reviewerAlias.name,
      reviewerAvatar:   reviewerAlias.avatarUrl,
    })
    .from(reviews)
    .innerJoin(reviewerAlias, eq(reviews.reviewerId, reviewerAlias.id))
    .where(eq(reviews.revieweeId, freelancerId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  const services = await db
    .select()
    .from(freelancerServices)
    .where(eq(freelancerServices.freelancerId, freelancerId));

  const approvedServices = services.filter((s) => s.status === "approved");

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />
      <main className="flex-1">
        <ProfilePreviewClient
          user={user}
          profile={profile}
          skills={skills}
          workExperiences={workExperiences}
          reviews={userReviews}
          services={approvedServices}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
