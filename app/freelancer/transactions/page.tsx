import { db } from "@/lib/db";
import { transactions, projectSubmissions, projects, jobs, serviceOrders, freelancerServices } from "@/drizzle/schema";
import { eq, desc, and, sum, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Banknote } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Earnings — Hirewex" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export default async function FreelancerTransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");

  const [rows, [earned]] = await Promise.all([
    // All release transactions for this freelancer
    db
      .select({ tx: transactions })
      .from(transactions)
      .where(and(eq(transactions.userId, session.user.id), eq(transactions.type, "release")))
      .orderBy(desc(transactions.createdAt))
      .limit(200),

    // Total earned (sum of all release transactions)
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(eq(transactions.userId, session.user.id), eq(transactions.type, "release"))),
  ]);

  const totalEarned = Number(earned?.total ?? 0);

  return (
    <DashboardShell title="Earnings" role="freelancer">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
            <p className="text-muted-foreground mt-1">Payments released to you by the admin.</p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Total Earned</p>
              <p className="text-lg font-bold text-emerald-600">${totalEarned.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Payouts</p>
              <p className="text-lg font-bold">{rows.length}</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border bg-muted/20">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment History</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Amount", "Description", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ tx }) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-emerald-600 text-base">+${Number(tx.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground max-w-sm">
                      {tx.description ?? "Payment released"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="py-20 text-center">
                <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Banknote className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No payments yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Once the admin releases payment for your accepted work, it will appear here.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
