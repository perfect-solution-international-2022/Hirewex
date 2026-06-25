import { db } from "@/lib/db";
import { transactions, projectSubmissions, projects, serviceOrders } from "@/drizzle/schema";
import { eq, isNull, and, sql, count } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, DollarSign, Clock, TrendingUp, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Wallet — Hirewex" };

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

const typeColor: Record<string, string> = {
  deposit:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  withdrawal: "bg-red-100 text-red-700 border-red-200",
  escrow:     "bg-amber-100 text-amber-700 border-amber-200",
  release:    "bg-blue-100 text-blue-700 border-blue-200",
  fee:        "bg-purple-100 text-purple-700 border-purple-200",
  refund:     "bg-orange-100 text-orange-700 border-orange-200",
};

export default async function AdminWalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const [[totals], [pendingCount], recentFees] = await Promise.all([
    // Aggregate all transaction amounts by type in one query
    db.select({
      totalDeposits:    sql<number>`COALESCE(SUM(CASE WHEN type = 'deposit'    THEN amount ELSE 0 END), 0)`,
      totalWithdrawals: sql<number>`COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)`,
      totalEscrow:      sql<number>`COALESCE(SUM(CASE WHEN type = 'escrow'     THEN amount ELSE 0 END), 0)`,
      totalReleased:    sql<number>`COALESCE(SUM(CASE WHEN type = 'release'    THEN amount ELSE 0 END), 0)`,
      totalFees:        sql<number>`COALESCE(SUM(CASE WHEN type = 'fee'        THEN amount ELSE 0 END), 0)`,
    }).from(transactions),

    // Count submissions accepted by buyer but not yet released by admin
    db.select({ value: count() })
      .from(projectSubmissions)
      .where(and(eq(projectSubmissions.status, "accepted"), isNull(projectSubmissions.paymentReleasedAt))),

    // Most recent fee (admin earnings) transactions
    db.select({ tx: transactions })
      .from(transactions)
      .where(eq(transactions.type, "fee"))
      .orderBy(sql`${transactions.createdAt} DESC`)
      .limit(20),
  ]);

  const held = Number(totals.totalEscrow) - Number(totals.totalReleased);

  const stats = [
    {
      label: "Held in Escrow",
      value: `$${fmt(held < 0 ? 0 : held)}`,
      sub: "Buyer payments awaiting release",
      icon: Wallet,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "Pending Payouts",
      value: String(pendingCount.value),
      sub: "Buyer-approved, not yet released",
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Platform Earnings",
      value: `$${fmt(Number(totals.totalFees))}`,
      sub: "Commission + service fees collected",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      label: "Total Released",
      value: `$${fmt(Number(totals.totalReleased))}`,
      sub: "Paid out to freelancers",
      icon: ArrowUpFromLine,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Total Deposits",
      value: `$${fmt(Number(totals.totalDeposits))}`,
      sub: "Deposited by buyers",
      icon: ArrowDownToLine,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Total Withdrawn",
      value: `$${fmt(Number(totals.totalWithdrawals))}`,
      sub: "Withdrawn by freelancers",
      icon: Banknote,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  return (
    <DashboardShell title="Admin Wallet" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Wallet</h1>
          <p className="text-muted-foreground mt-1">Platform financial overview — money held, earned, and paid out.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="shadow-sm">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold tracking-tight mt-0.5">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent platform earnings */}
        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
            <CardTitle className="text-base font-semibold">Recent Platform Earnings</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Type", "Amount", "Description", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentFees.map(({ tx }) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${typeColor[tx.type] ?? "bg-muted text-muted-foreground"}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-purple-600">+${Number(tx.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{tx.description ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentFees.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No earnings yet.</div>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
