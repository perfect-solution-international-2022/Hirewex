import { db } from "@/lib/db";
import { projectSubmissions, projects, jobs, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SubmittedWorkClient } from "./SubmittedWorkClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submitted Work — Hirewex",
};

export default async function SubmittedWorkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const submissions = await db
    .select({
      submission: projectSubmissions,
      project: projects,
      job: jobs,
      freelancer: users,
    })
    .from(projectSubmissions)
    .innerJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .innerJoin(jobs, eq(projects.jobId, jobs.id))
    .innerJoin(users, eq(projectSubmissions.freelancerId, users.id))
    .where(eq(projectSubmissions.buyerId, session.user.id))
    .orderBy(desc(projectSubmissions.createdAt));

  return (
    <DashboardShell title="Submitted Work" role="buyer">
      <div className="mx-auto w-full max-w-5xl">
        <SubmittedWorkClient submissions={submissions} />
      </div>
    </DashboardShell>
  );
}
