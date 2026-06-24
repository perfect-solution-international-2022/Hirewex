import { db } from "@/lib/db";
import { supportTickets, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support Tickets — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusColor: Record<string, string> = {
  open:     "bg-amber-100 text-amber-700 border-amber-200",
  answered: "bg-blue-100 text-blue-700 border-blue-200",
  closed:   "bg-muted text-muted-foreground border-border",
};

const priorityColor: Record<string, string> = {
  low:    "bg-muted text-muted-foreground",
  medium: "bg-blue-100 text-blue-700",
  high:   "bg-red-100 text-red-700",
};

export default async function AdminTicketsPage() {
  const rows = await db
    .select({ ticket: supportTickets, user: users })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(desc(supportTickets.createdAt))
    .limit(500);

  const openCount = rows.filter((r) => r.ticket.status === "open").length;

  return (
    <DashboardShell title="Support Tickets" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground mt-1">{rows.length} total · {openCount} open</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["User", "Subject", "Priority", "Status", "Opened"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ ticket, user }) => {
                  const name = user?.displayName || user?.name || user?.email || "Unknown";
                  return (
                    <tr key={ticket.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3 max-w-xs truncate">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold capitalize px-2 py-0.5 rounded-full ${priorityColor[ticket.priority ?? "medium"] ?? ""}`}>
                          {ticket.priority ?? "medium"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor[ticket.status]}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(ticket.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="py-16 text-center text-muted-foreground">No tickets yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
