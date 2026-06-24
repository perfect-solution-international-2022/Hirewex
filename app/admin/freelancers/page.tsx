import { db } from "@/lib/db";
import { users, userRoles, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Freelancers — Admin" };

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const kycColor: Record<string, string> = {
  approved:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:    "bg-amber-100 text-amber-700 border-amber-200",
  rejected:   "bg-red-100 text-red-700 border-red-200",
  unverified: "bg-muted text-muted-foreground border-border",
};

export default async function AdminFreelancersPage() {
  const freelancerRoles = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(eq(userRoles.role, "freelancer"));

  const freelancerIds = freelancerRoles.map((r) => r.userId);

  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(users.id, profiles.id))
    .orderBy(desc(users.createdAt));

  const freelancers = rows.filter((r) => freelancerIds.includes(r.user.id));

  return (
    <DashboardShell title="Freelancers" role="admin">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Freelancers</h1>
          <p className="text-muted-foreground mt-1">{freelancers.length} registered freelancers</p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Freelancer", "Email", "Balance", "Rating", "Jobs Done", "KYC", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {freelancers.map(({ user, profile }) => {
                  const name = user.displayName || user.name || "—";
                  const avatar = profile?.avatarUrl || user.avatarUrl || user.image || "";
                  const kyc = profile?.kycStatus ?? "unverified";
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
                      <td className="px-4 py-3 font-bold text-emerald-600">${Number(profile?.balance ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3">{profile?.rating ? Number(profile.rating).toFixed(1) : "—"}</td>
                      <td className="px-4 py-3">{profile?.jobsCompleted ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${kycColor[kyc]}`}>
                          {kyc}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {freelancers.length === 0 && <div className="py-16 text-center text-muted-foreground">No freelancers yet.</div>}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
