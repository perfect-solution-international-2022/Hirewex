import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { freelancerServices, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hirewex.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,               lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${SITE_URL}/service`,  lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${SITE_URL}/jobs`,     lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
  ];

  // Dynamic: approved service pages
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const services = await db
      .select({ id: freelancerServices.id, updatedAt: freelancerServices.createdAt })
      .from(freelancerServices)
      .where(eq(freelancerServices.status, "approved"));

    serviceRoutes = services.map((s) => ({
      url: `${SITE_URL}/service/${s.id}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {}

  // Dynamic: freelancer profile pages
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const freelancers = await db
      .select({ id: users.id, createdAt: users.createdAt })
      .from(users);

    profileRoutes = freelancers.map((u) => ({
      url: `${SITE_URL}/profile-preview/${u.id}`,
      lastModified: u.createdAt ? new Date(u.createdAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {}

  return [...staticRoutes, ...serviceRoutes, ...profileRoutes];
}
