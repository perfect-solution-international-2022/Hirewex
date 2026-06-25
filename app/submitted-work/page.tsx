import { db } from "@/lib/db";
import { projectSubmissions, projects, jobs, users, serviceOrders, freelancerServices, refundRequests } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SubmittedWorkClient } from "./SubmittedWorkClient";
import { getMyReviewedIds } from "@/app/actions/reviews";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submitted Work — Hirewex",
};

export default async function SubmittedWorkPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const [submissions, reviewed, myRefunds] = await Promise.all([
    db.select({
      submission: projectSubmissions,
      project: projects,
      job: jobs,
      serviceOrder: serviceOrders,
      service: freelancerServices,
      freelancer: users,
    })
    .from(projectSubmissions)
    .leftJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .leftJoin(jobs, eq(projects.jobId, jobs.id))
    .leftJoin(serviceOrders, eq(projectSubmissions.serviceOrderId, serviceOrders.id))
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .innerJoin(users, eq(projectSubmissions.freelancerId, users.id))
    .where(eq(projectSubmissions.buyerId, session.user.id))
    .orderBy(desc(projectSubmissions.createdAt)),

    getMyReviewedIds(session.user.id),

    db.select()
      .from(refundRequests)
      .where(eq(refundRequests.buyerId, session.user.id))
      .orderBy(desc(refundRequests.createdAt)),
  ]);

  // Build lookup: projectId | serviceOrderId → refund
  const refundByProject = new Map(myRefunds.filter(r => r.projectId).map(r => [r.projectId!, r]));
  const refundByOrder   = new Map(myRefunds.filter(r => r.serviceOrderId).map(r => [r.serviceOrderId!, r]));

  return (
    <DashboardShell title="Submitted Work" role="buyer">
      <div className="mx-auto w-full max-w-5xl">
        <SubmittedWorkClient
          submissions={submissions}
          reviewedProjectIds={reviewed.projectIds}
          reviewedOrderIds={reviewed.orderIds}
          refundByProject={Object.fromEntries(refundByProject)}
          refundByOrder={Object.fromEntries(refundByOrder)}
        />
      </div>
    </DashboardShell>
  );
}
