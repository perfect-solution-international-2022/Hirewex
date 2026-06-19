import { db } from "@/lib/db";
import { freelancerServices, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth"; 
import { ServicesClient } from "./ServicesClient";

export const metadata = {
  title: "Find Services — Hirewex",
};

export default async function ServicesPage() {
  const session = await auth();

  // Only fetch approved services
  const liveServices = await db
    .select({
      service: freelancerServices,
      user: {
        name: users.name,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        image: users.image,
        title: users.title,
      }
    })
    .from(freelancerServices)
    .innerJoin(users, eq(freelancerServices.freelancerId, users.id))
    .where(eq(freelancerServices.status, "approved"))
    .orderBy(desc(freelancerServices.createdAt));

  return (
    // Render without KycGuard or redirects so anyone can view
    <ServicesClient 
      initialServices={liveServices} 
      currentUserId={session?.user?.id} 
    />
  );
}