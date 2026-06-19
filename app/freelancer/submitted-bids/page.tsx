import { db } from "@/lib/db";
import { bids, jobs, users, categories } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SubmittedBidsClient } from "./SubmittedBidsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submitted Bids — Hirewex",
};

export default async function SubmittedBidsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const myBids = await db
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
    .where(eq(bids.freelancerId, session.user.id))
    .orderBy(desc(bids.createdAt));

  return (
    <DashboardShell title="Submitted Bids" role="freelancer">
      <div className="mx-auto w-full max-w-5xl">
        <SubmittedBidsClient initialBids={myBids} />
      </div>
    </DashboardShell>
  );
}
