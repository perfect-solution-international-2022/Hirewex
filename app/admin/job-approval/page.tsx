import { db } from "@/lib/db";
import { jobs, users, categories } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { JobApprovalManager } from "./JobApprovalManager";

export const metadata = {
  title: "Job Approval — Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminJobApprovalPage() {
  const pendingJobs = await db
    .select({
      job: jobs,
      user: users,
      category: categories,
    })
    .from(jobs)
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .where(eq(jobs.approvalStatus, "pending"))
    .orderBy(desc(jobs.createdAt));

  return (
    <DashboardShell title="Job Approval" role="admin">
      <div className="mx-auto w-full max-w-7xl">
        <JobApprovalManager initialJobs={pendingJobs} />
      </div>
    </DashboardShell>
  );
}
