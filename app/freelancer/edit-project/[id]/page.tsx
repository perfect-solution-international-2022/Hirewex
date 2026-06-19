import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EditProjectClient from "./EditProjectClient";

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  // Await params in Next.js 15+ (if using Turbopack, it's a good habit)
  const resolvedParams = await params;
  const serviceId = resolvedParams.id;

  // Fetch the specific service
  const [service] = await db.select()
    .from(freelancerServices)
    .where(
      and(
        eq(freelancerServices.id, serviceId),
        eq(freelancerServices.freelancerId, session.user.id)
      )
    );

  // If the service doesn't exist or doesn't belong to them, kick them back to projects
  if (!service) {
    redirect("/freelancer/projects");
  }

  return <EditProjectClient initialData={service} />;
}