import { db } from "@/lib/db";
import { refundRequests, users, projects, serviceOrders, jobs, freelancerServices } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RefundClient } from "./RefundClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Refund Requests — Admin" };

const buyer = aliasedTable(users, "buyer");
const freelancer = aliasedTable(users, "freelancer");

export default async function AdminRefundsPage() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) redirect("/auth");

  const rows = await db
    .select({
      refund: refundRequests,
      buyer: buyer,
      freelancer: freelancer,
      project: projects,
      job: jobs,
      serviceOrder: serviceOrders,
      service: freelancerServices,
    })
    .from(refundRequests)
    .leftJoin(buyer, eq(refundRequests.buyerId, buyer.id))
    .leftJoin(freelancer, eq(refundRequests.freelancerId, freelancer.id))
    .leftJoin(projects, eq(refundRequests.projectId, projects.id))
    .leftJoin(jobs, eq(projects.jobId, jobs.id))
    .leftJoin(serviceOrders, eq(refundRequests.serviceOrderId, serviceOrders.id))
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .orderBy(desc(refundRequests.createdAt));

  return (
    <DashboardShell title="Refund Requests" role="admin">
      <div className="mx-auto w-full max-w-6xl">
        <RefundClient rows={rows} />
      </div>
    </DashboardShell>
  );
}
