import { db } from "@/lib/db";
import { jobs, categories, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { JobManager } from "./JobManager";

export const metadata = {
  title: "Manage Jobs — Admin",
};

export default async function AdminJobsPage() {
  const allJobs = await db
    .select({
      job: jobs,
      category: categories,
      user: users,
    })
    .from(jobs)
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(jobs.buyerId, users.id));

  return (
    <DashboardShell title="Platform Jobs" role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <JobManager initialJobs={allJobs} />
      </div>
    </DashboardShell>
  );
}
