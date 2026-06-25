import { db } from "@/lib/db";
import { users, jobs, bids, projects, transactions } from "@/drizzle/schema";
import { count, sql } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export const metadata = {
  title: "Admin — Hirewex",
};

export default async function AdminPage() {
  const [userCountRes, jobCountRes, bidCountRes, projectCountRes, [earnings]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(bids),
    db.select({ value: count() }).from(projects),
    db.select({
      totalFees: sql<number>`COALESCE(SUM(CASE WHEN type = 'fee' THEN amount ELSE 0 END), 0)`,
    }).from(transactions),
  ]);

  const realStats = {
    users: userCountRes[0].value,
    jobs: jobCountRes[0].value,
    bids: bidCountRes[0].value,
    projects: projectCountRes[0].value,
  };

  const platformEarnings = Number(earnings.totalFees);

  return (
    <DashboardShell title="Admin Panel" role="admin">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Users", realStats.users],
          ["Jobs", realStats.jobs],
          ["Bids", realStats.bids],
          ["Projects", realStats.projects],
        ].map(([l, v]) => (
          <Card key={l as string} className="p-5 flex flex-col justify-center">
            <p className="text-3xl font-bold text-primary mb-1">{v ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground">{l as string}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform Earnings</p>
            <p className="text-3xl font-bold tracking-tight text-purple-600">
              ${platformEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Total commission + service fees collected</p>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}