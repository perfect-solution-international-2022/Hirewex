import { db } from "@/lib/db";
import { users, profiles, freelancerSkills, freelancerWorkExperiences, reviews, freelancerServices } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { ProfilePreviewClient } from "./ProfilePreviewClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { freelancerId: string } }) {
  const resolvedParams = await params;
  const [user] = await db
    .select({ name: users.name, displayName: users.displayName })
    .from(users)
    .where(eq(users.id, resolvedParams.freelancerId));

  return {
    title: user ? `${user.displayName || user.name} — Profile` : "Profile",
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

  const userReviews = await db
    .select()
    .from(reviews)
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
