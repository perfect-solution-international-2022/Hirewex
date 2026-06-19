import { db } from "@/lib/db";
import { bids, jobs, users, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MyBidsClient } from "./MyBidsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Bids — Hirewex",
};

export default async function MyBidsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  // Fetch all bids on jobs posted by this buyer
  const allBids = await db
    .select({
      bid: bids,
      job: jobs,
      freelancer: users,
      profile: profiles,
    })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .leftJoin(users, eq(bids.freelancerId, users.id))
    .leftJoin(profiles, eq(bids.freelancerId, profiles.id))
    .where(eq(jobs.buyerId, session.user.id))
    .orderBy(desc(bids.createdAt));

  return (
    <DashboardShell title="My Bids" role="buyer">
      <div className="mx-auto w-full max-w-5xl pb-8">
        <MyBidsClient initialBids={allBids} />
      </div>
    </DashboardShell>
  );
}