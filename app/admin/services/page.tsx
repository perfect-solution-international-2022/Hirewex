import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema"; 
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ServiceManager } from "./ServiceManager";

export const metadata = {
  title: "Manage Services — Admin",
};

export default async function AdminServicesPage() {
  // Fetch all services from your specific table
  const allServices = await db.select().from(freelancerServices);

  return (
    <DashboardShell title="Platform Services" role="admin">
      <div className="mx-auto w-full max-w-5xl">
        <ServiceManager initialServices={allServices} />
      </div>
    </DashboardShell>
  );
}