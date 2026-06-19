import { db } from "@/lib/db";
import { freelancerServices, users, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ServiceApprovalManager } from "./ServiceApprovalManager";

export const metadata = {
  title: "Service Approval — Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminServiceApprovalPage() {
  const pendingServices = await db
    .select({
      service: freelancerServices,
      user: users,
      profile: profiles,
    })
    .from(freelancerServices)
    .leftJoin(users, eq(freelancerServices.freelancerId, users.id))
    .leftJoin(profiles, eq(freelancerServices.freelancerId, profiles.id))
    .where(eq(freelancerServices.status, "pending"))
    .orderBy(desc(freelancerServices.createdAt));

  return (
    <DashboardShell title="Service Approval" role="admin">
      <div className="mx-auto w-full max-w-7xl">
        <ServiceApprovalManager initialServices={pendingServices} />
      </div>
    </DashboardShell>
  );
}
