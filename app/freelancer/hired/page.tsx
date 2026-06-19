import { db } from "@/lib/db";
import { bids, jobs, users, categories } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { HiredJobsClient } from "./HiredJobsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hired Jobs — Hirewex",
};

export default async function HiredJobsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const hiredJobs = await db
    .select({
      bid: bids,
      job: jobs,
      buyer: users,
      category: categories,
    })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .where(and(eq(bids.freelancerId, session.user.id), eq(bids.status, "accepted")))
    .orderBy(desc(bids.createdAt));

  return (
    <DashboardShell title="Hired Jobs" role="freelancer">
      <div className="mx-auto w-full max-w-5xl">
        <HiredJobsClient hiredJobs={hiredJobs} />
      </div>
    </DashboardShell>
  );
}
