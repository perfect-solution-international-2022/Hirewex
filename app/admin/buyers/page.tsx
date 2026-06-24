import { db } from "@/lib/db";
import { users, userRoles, jobs } from "@/drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buyers — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

export default async function AdminBuyersPage() {
  const buyerRoles = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.role, "buyer"));

  const buyerIds = buyerRoles.map((r) => r.userId);

  const rows = await db
    .select({ user: users })
    .from(users)
    .orderBy(desc(users.createdAt));

  const buyers = rows.filter((r) => buyerIds.includes(r.user.id));

  const jobCounts = await db
    .select({ buyerId: jobs.buyerId, total: count() })
    .from(jobs)
    .groupBy(jobs.buyerId);

  const jobMap = new Map(jobCounts.map((j) => [j.buyerId, j.total]));

  return (
    <DashboardShell title="Buyers" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buyers</h1>
          <p className="text-muted-foreground mt-1">{buyers.length} registered buyers</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Buyer", "Email", "Jobs Posted", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {buyers.map(({ user }) => {
                  const name = user.displayName || user.name || "—";
                  const avatar = user.avatarUrl || user.image || "";
                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={avatar} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">{jobMap.get(user.id) ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {buyers.length === 0 && <div className="py-16 text-center text-muted-foreground">No buyers yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
