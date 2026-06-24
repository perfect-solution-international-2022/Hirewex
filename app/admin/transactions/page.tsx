import { db } from "@/lib/db";
import { transactions, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine, ArrowUpFromLine, DollarSign, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Transactions — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

const typeColor: Record<string, string> = {
  deposit:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  withdrawal: "bg-red-100 text-red-700 border-red-200",
  escrow:     "bg-amber-100 text-amber-700 border-amber-200",
  release:    "bg-blue-100 text-blue-700 border-blue-200",
  fee:        "bg-purple-100 text-purple-700 border-purple-200",
  refund:     "bg-orange-100 text-orange-700 border-orange-200",
};

const statusColor: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  failed:    "bg-red-100 text-red-700",
  cancelled: "bg-muted text-muted-foreground",
};

export default async function AdminTransactionsPage() {
  const rows = await db
    .select({ tx: transactions, user: users })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(500);

  const total = rows.reduce((s, r) => s + Number(r.tx.amount), 0);

  return (
    <DashboardShell title="Transactions" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Transactions</h1>
            <p className="text-muted-foreground mt-1">{rows.length} transactions · ${total.toFixed(2)} total volume</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["User", "Type", "Amount", "Status", "Description", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ tx, user }) => {
                  const name = user?.displayName || user?.name || user?.email || "Unknown";
                  return (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${typeColor[tx.type] ?? "bg-muted text-muted-foreground"}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">${Number(tx.amount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[tx.status] ?? "bg-muted text-muted-foreground"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{tx.description ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">No transactions yet.</div>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
