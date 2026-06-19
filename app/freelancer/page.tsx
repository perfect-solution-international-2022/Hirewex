// app/freelancer/page.tsx (or app/freelancer/dashboard/page.tsx)
import { db } from "@/lib/db";
import { freelancerServices } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import FreelancerDashboardClient from "./DashboardClient";

export const metadata = {
  title: "Freelancer Dashboard — Hirewex",
};

export default async function FreelancerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // 1. Fetch all services for this specific freelancer
  const services = await db
    .select({ status: freelancerServices.status })
    .from(freelancerServices)
    .where(eq(freelancerServices.freelancerId, session.user.id));

  // 2. Count occurrences of each status
  const stats = { approved: 0, pending: 0, requires_modification: 0, denied: 0 };
  services.forEach((s) => {
    if (s.status && s.status in stats) {
      stats[s.status as keyof typeof stats]++;
    }
  });

  // 3. Format data for Recharts (Filtering out statuses that have 0 services)
  const projectStatusData = [
    { name: "Active", value: stats.approved, color: "var(--chart-1, #10b981)" },
    { name: "Pending", value: stats.pending, color: "var(--chart-3, #f59e0b)" },
    { name: "Needs Mod", value: stats.requires_modification, color: "var(--chart-2, #3b82f6)" },
    { name: "Denied", value: stats.denied, color: "var(--chart-4, #ef4444)" },
  ].filter((d) => d.value > 0); 

  // If the user has zero services, provide a default empty state
  if (projectStatusData.length === 0) {
    projectStatusData.push({ name: "No Services", value: 1, color: "#cbd5e1" });
  }

  // 4. Pass the dynamic data to the Client UI
  return <FreelancerDashboardClient projectStatusData={projectStatusData} />;
}