import { db } from "@/lib/db";
import { withdrawals, withdrawalMethods, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Withdrawals — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusColor: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  failed:    "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default async function AdminWithdrawalsPage() {
  const rows = await db
    .select({ wd: withdrawals, user: users, method: withdrawalMethods })
    .from(withdrawals)
    .leftJoin(users, eq(withdrawals.userId, users.id))
    .leftJoin(withdrawalMethods, eq(withdrawals.methodId, withdrawalMethods.id))
    .orderBy(desc(withdrawals.createdAt))
    .limit(500);

  const pending = rows.filter((r) => r.wd.status === "pending");

  return (
    <DashboardShell title="Withdrawals" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Withdrawals</h1>
          <p className="text-muted-foreground mt-1">
            {rows.length} total · {pending.length} pending approval
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["User", "Amount", "Fee", "Net", "Method", "Status", "Requested"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ wd, user, method }) => {
                  const name = user?.displayName || user?.name || user?.email || "Unknown";
                  const net = Number(wd.amount) - Number(wd.fee ?? 0);
                  return (
                    <tr key={wd.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 font-bold">${Number(wd.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-red-600">−${Number(wd.fee ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">${net.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{method?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor[wd.status] ?? "bg-muted"}`}>
                          {wd.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(wd.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="py-16 text-center text-muted-foreground">No withdrawals yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
