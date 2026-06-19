import { db } from "@/lib/db";
import { kycApplications, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { KycManager } from "./KycManager";

export const metadata = {
  title: "Identity Verification — Admin",
};

export default async function AdminKycPage() {
  const pendingApplications = await db
    .select({
      app: kycApplications,
      user: users,
    })
    .from(kycApplications)
    .leftJoin(users, eq(kycApplications.userId, users.id))
    .where(eq(kycApplications.status, "pending"));

  return (
    <DashboardShell title="Identity Verification" role="admin">
      <div className="mx-auto w-full max-w-6xl">
        <KycManager initialApplications={pendingApplications} />
      </div>
    </DashboardShell>
  );
}
