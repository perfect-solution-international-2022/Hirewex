// app/my-projects/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MyProjectsClient } from "./MyProjectsClient"; // Assuming it's in the same folder

export const dynamic = "force-dynamic";

export default async function MyProjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth?mode=signin");
  }

  const myJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.buyerId, session.user.id))
    .orderBy(desc(jobs.createdAt));

  return (
    // CRITICAL: Only pass role="buyer". Do not pass groups={buyerNav} here.
    <DashboardShell title="My Projects" role="buyer">
      <MyProjectsClient jobs={myJobs} />
    </DashboardShell>
  );
}