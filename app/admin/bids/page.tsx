import { db } from "@/lib/db";
import { bids, jobs, users } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { alias } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bids — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusColor: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  accepted:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected:  "bg-red-100 text-red-700 border-red-200",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const fl = alias(users, "fl");

export default async function AdminBidsPage() {
  const rows = await db
    .select({ bid: bids, job: jobs, freelancer: fl })
    .from(bids)
    .leftJoin(jobs, eq(bids.jobId, jobs.id))
    .innerJoin(fl, eq(bids.freelancerId, fl.id))
    .orderBy(desc(bids.createdAt))
    .limit(500);

  return (
    <DashboardShell title="All Bids" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Bids</h1>
          <p className="text-muted-foreground mt-1">{rows.length} bids on the platform</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Freelancer", "Job", "Amount", "Delivery", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ bid, job, freelancer }) => {
                  const name = freelancer?.displayName || freelancer?.name || freelancer?.email || "Unknown";
                  return (
                    <tr key={bid.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{name}</td>
                      <td className="px-4 py-3">
                        {job ? (
                          <Link href={`/admin/jobs/${job.id}`} className="text-primary hover:underline truncate max-w-xs block">
                            {job.title}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold">${Number(bid.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">{bid.deliveryDays ? `${bid.deliveryDays}d` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor[bid.status] ?? "bg-muted text-muted-foreground"}`}>
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(bid.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <div className="py-16 text-center text-muted-foreground">No bids yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
