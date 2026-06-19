import { db } from "@/lib/db";
import { users, jobs, bids, projects } from "@/drizzle/schema";
import { count } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export const metadata = {
  title: "Admin — Hirewex",
};

export default async function AdminPage() {
  // Fetch live stats
  const [userCountRes, jobCountRes, bidCountRes, projectCountRes] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(bids),
    db.select({ value: count() }).from(projects),
  ]);

  const realStats = {
    users: userCountRes[0].value,
    jobs: jobCountRes[0].value,
    bids: bidCountRes[0].value,
    projects: projectCountRes[0].value,
  };

  return (
    // FIXED: Removed the groups={groups} prop! DashboardShell handles it now.
    <DashboardShell title="Admin Panel" role="admin">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total users", realStats.users],
          ["Jobs", realStats.jobs],
          ["Bids", realStats.bids],
          ["Projects", realStats.projects]
        ].map(([l, v]) => (
          <Card key={l as string} className="p-5 flex flex-col justify-center">
            <p className="text-3xl font-bold text-primary mb-1">{v ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground">{l as string}</p>
          </Card>
        ))}
      </div>
      
      <Card className="mt-6 p-8 text-center text-muted-foreground border-dashed">
        <LayoutDashboard className="h-8 w-8 mx-auto mb-3 opacity-20" />
        <p>Admin command center.</p> 
        <p className="text-sm mt-1">Live data is now connected to your MySQL instance.</p>
      </Card>
    </DashboardShell>
  );
}