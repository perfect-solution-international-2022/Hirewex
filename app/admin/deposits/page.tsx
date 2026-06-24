import { db } from "@/lib/db";
import { deposits, users } from "@/drizzle/schema";
import { eq, desc, sum } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deposits — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusColor: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  failed:    "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default async function AdminDepositsPage() {
  const rows = await db
    .select({ dep: deposits, user: users })
    .from(deposits)
    .leftJoin(users, eq(deposits.userId, users.id))
    .orderBy(desc(deposits.createdAt))
    .limit(500);

  const totalCompleted = rows
    .filter((r) => r.dep.status === "completed")
    .reduce((s, r) => s + Number(r.dep.amount), 0);

  return (
    <DashboardShell title="Deposits" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deposits</h1>
            <p className="text-muted-foreground mt-1">{rows.length} deposits · ${totalCompleted.toFixed(2)} completed</p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["User", "Amount", "Method", "Status", "Reference", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ dep, user }) => {
                  const name = user?.displayName || user?.name || user?.email || "Unknown";
                  return (
                    <tr key={dep.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 font-bold">${Number(dep.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{dep.method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor[dep.status] ?? "bg-muted text-muted-foreground"}`}>
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{dep.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(dep.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="py-16 text-center text-muted-foreground">No deposits yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
