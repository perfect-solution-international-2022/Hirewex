import { db } from "@/lib/db";
import { freelancerServices, users, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { Suspense } from "react";
import { ServicesClient } from "./ServicesClient";

export const metadata = {
  title: "Find Freelance Services — Web, Design, Marketing & More",
  description:
    "Browse thousands of freelance services from vetted professionals. Hire web developers, graphic designers, copywriters, SEO experts, video editors and more on Hirewex.",
  keywords: [
    "freelance services", "hire freelancer", "web development services",
    "graphic design services", "copywriting services", "SEO services",
    "video editing services", "freelance marketplace",
  ],
  openGraph: {
    title: "Find Freelance Services — Hirewex",
    description: "Browse and hire from thousands of vetted freelancers across web, design, marketing, writing and more.",
    type: "website",
  },
};

export default async function ServicesPage() {
  const session = await auth();

  const liveServices = await db
    .select({
      service: freelancerServices,
      user: {
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        image: users.image,
        title: users.title,
      },
      profile: {
        rating: profiles.rating,
        totalReviews: profiles.totalReviews,
      },
    })
    .from(freelancerServices)
    .innerJoin(users, eq(freelancerServices.freelancerId, users.id))
    .leftJoin(profiles, eq(users.id, profiles.id))
    .where(eq(freelancerServices.status, "approved"))
    .orderBy(desc(freelancerServices.createdAt));

  return (
    <Suspense fallback={null}>
      <ServicesClient
        initialServices={liveServices}
        currentUserId={session?.user?.id}
      />
    </Suspense>
  );
}