import { db } from "@/lib/db";
import { users, jobs, bids, projects, transactions, projectSubmissions } from "@/drizzle/schema";
import { count, sql, eq, and, isNull } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard — Hirewex" };

export default async function AdminPage() {
  const [
    [userCount],
    [jobCount],
    [bidCount],
    [projectCount],
    [feeSummary],
    [pendingPayouts],
    monthlyRevenue,
    submissionStats,
    recentTx,
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(jobs),
    db.select({ value: count() }).from(bids),
    db.select({ value: count() }).from(projects),

    db.select({
      totalFees:     sql<number>`COALESCE(SUM(CASE WHEN type = 'fee'     THEN amount ELSE 0 END), 0)`,
      totalReleased: sql<number>`COALESCE(SUM(CASE WHEN type = 'release' THEN amount ELSE 0 END), 0)`,
    }).from(transactions),

    db.select({ value: count() })
      .from(projectSubmissions)
      .where(and(eq(projectSubmissions.status, "accepted"), isNull(projectSubmissions.paymentReleasedAt))),

    db.select({
      month:    sql<string>`DATE_FORMAT(created_at, '%b')`,
      fees:     sql<number>`COALESCE(SUM(CASE WHEN type = 'fee'     THEN amount ELSE 0 END), 0)`,
      released: sql<number>`COALESCE(SUM(CASE WHEN type = 'release' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(sql`created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`)
    .groupBy(sql`DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b')`)
    .orderBy(sql`DATE_FORMAT(created_at, '%Y-%m')`),

    db.select({ status: projectSubmissions.status, total: count() })
      .from(projectSubmissions)
      .groupBy(projectSubmissions.status),

    db.select({
      id:          transactions.id,
      type:        transactions.type,
      amount:      transactions.amount,
      description: transactions.description,
      createdAt:   transactions.createdAt,
    })
    .from(transactions)
    .orderBy(sql`created_at DESC`)
    .limit(8),
  ]);

  return (
    <DashboardShell title="Admin" role="admin">
      <AdminDashboardClient
        counts={{
          users:    userCount.value,
          jobs:     jobCount.value,
          bids:     bidCount.value,
          projects: projectCount.value,
        }}
        earnings={{
          totalFees:      Number(feeSummary.totalFees),
          totalReleased:  Number(feeSummary.totalReleased),
          pendingPayouts: pendingPayouts.value,
        }}
        monthlyRevenue={monthlyRevenue}
        submissionStats={submissionStats}
        recentTx={recentTx}
      />
    </DashboardShell>
  );
}
