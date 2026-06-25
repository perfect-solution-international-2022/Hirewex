import { db } from "@/lib/db";
import { users, jobs, bids, projects, transactions, projectSubmissions } from "@/drizzle/schema";
import { count, sql, gte } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Dashboard — Hirewex" };

export default async function AdminPage() {
  const [
    [counts],
    [earnings],
    monthlyRevenue,
    submissionStats,
    recentTx,
  ] = await Promise.all([
    // Core platform counts
    db.select({
      users:    sql<number>`(SELECT COUNT(*) FROM users)`,
      jobs:     sql<number>`(SELECT COUNT(*) FROM jobs)`,
      bids:     sql<number>`(SELECT COUNT(*) FROM bids)`,
      projects: sql<number>`(SELECT COUNT(*) FROM projects)`,
    }).from(users).limit(1),

    // Finance summary
    db.select({
      totalFees:       sql<number>`COALESCE(SUM(CASE WHEN type = 'fee'     THEN amount ELSE 0 END), 0)`,
      totalReleased:   sql<number>`COALESCE(SUM(CASE WHEN type = 'release' THEN amount ELSE 0 END), 0)`,
      pendingPayouts:  sql<number>`(SELECT COUNT(*) FROM project_submissions WHERE ps_status = 'accepted' AND payment_released_at IS NULL)`,
    }).from(transactions),

    // Monthly fee + release volume for the last 6 months
    db.select({
      month:    sql<string>`DATE_FORMAT(created_at, '%b')`,
      sortKey:  sql<string>`DATE_FORMAT(created_at, '%Y-%m')`,
      fees:     sql<number>`COALESCE(SUM(CASE WHEN type = 'fee'     THEN amount ELSE 0 END), 0)`,
      released: sql<number>`COALESCE(SUM(CASE WHEN type = 'release' THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(gte(transactions.createdAt, sql`DATE_SUB(NOW(), INTERVAL 6 MONTH)`))
    .groupBy(sql`DATE_FORMAT(created_at, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(created_at, '%Y-%m') ASC`),

    // Submission status breakdown
    db.select({
      status: projectSubmissions.status,
      total:  count(),
    })
    .from(projectSubmissions)
    .groupBy(projectSubmissions.status),

    // Recent 8 transactions
    db.select({
      id:          transactions.id,
      type:        transactions.type,
      amount:      transactions.amount,
      description: transactions.description,
      createdAt:   transactions.createdAt,
    })
    .from(transactions)
    .orderBy(sql`${transactions.createdAt} DESC`)
    .limit(8),
  ]);

  return (
    <DashboardShell title="Admin" role="admin">
      <AdminDashboardClient
        counts={{
          users:    Number(counts.users),
          jobs:     Number(counts.jobs),
          bids:     Number(counts.bids),
          projects: Number(counts.projects),
        }}
        earnings={{
          totalFees:      Number(earnings.totalFees),
          totalReleased:  Number(earnings.totalReleased),
          pendingPayouts: Number(earnings.pendingPayouts),
        }}
        monthlyRevenue={monthlyRevenue}
        submissionStats={submissionStats}
        recentTx={recentTx}
      />
    </DashboardShell>
  );
}
