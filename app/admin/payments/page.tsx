import { db } from "@/lib/db";
import {
  projectSubmissions, projects, jobs, serviceOrders, freelancerServices, users,
} from "@/drizzle/schema";
import { eq, isNull, isNotNull, and, desc } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PaymentReleaseClient } from "./PaymentReleaseClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Payment Release — Admin" };

const fl = aliasedTable(users, "fl");
const by = aliasedTable(users, "by");

function submissionsQuery() {
  return db
    .select({
      submission: projectSubmissions,
      project: projects,
      job: jobs,
      serviceOrder: serviceOrders,
      service: freelancerServices,
      freelancer: fl,
      buyer: by,
    })
    .from(projectSubmissions)
    .leftJoin(projects, eq(projectSubmissions.projectId, projects.id))
    .leftJoin(jobs, eq(projects.jobId, jobs.id))
    .leftJoin(serviceOrders, eq(projectSubmissions.serviceOrderId, serviceOrders.id))
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .innerJoin(fl, eq(projectSubmissions.freelancerId, fl.id))
    .innerJoin(by, eq(projectSubmissions.buyerId, by.id));
}

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const [pending, released] = await Promise.all([
    submissionsQuery()
      .where(and(eq(projectSubmissions.status, "accepted"), isNull(projectSubmissions.paymentReleasedAt)))
      .orderBy(desc(projectSubmissions.createdAt)),
    submissionsQuery()
      .where(isNotNull(projectSubmissions.paymentReleasedAt))
      .orderBy(desc(projectSubmissions.paymentReleasedAt)),
  ]);

  return (
    <DashboardShell title="Payment Release" role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <PaymentReleaseClient pending={pending} released={released} />
      </div>
    </DashboardShell>
  );
}
