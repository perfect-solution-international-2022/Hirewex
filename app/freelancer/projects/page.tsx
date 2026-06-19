import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import ClientProjects from "./ClientProjects";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  // Fetch the services from the database
  const myServices = await db
    .select()
    .from(freelancerServices)
    .where(eq(freelancerServices.freelancerId, session.user.id))
    .orderBy(desc(freelancerServices.createdAt));

  return <ClientProjects services={myServices} />;
}