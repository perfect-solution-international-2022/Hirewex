"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Briefcase, TrendingUp, Clock, ArrowRightLeft,
  Receipt, ArrowUpRight, FileText, UserCog, UsersIcon,
} from "lucide-react";

const typeColor: Record<string, string> = {
  deposit:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  withdrawal: "bg-red-100 text-red-700 border-red-200",
  escrow:     "bg-amber-100 text-amber-700 border-amber-200",
  release:    "bg-blue-100 text-blue-700 border-blue-200",
  fee:        "bg-purple-100 text-purple-700 border-purple-200",
  refund:     "bg-orange-100 text-orange-700 border-orange-200",
};

const statusColor: Record<string, string> = {
  pending:            "#f59e0b",
  accepted:           "#10b981",
  rejected:           "#ef4444",
  revision_requested: "#3b82f6",
};

const statusLabel: Record<string, string> = {
  pending:            "Pending Review",
  accepted:           "Accepted",
  rejected:           "Rejected",
  revision_requested: "Revision",
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

export function AdminDashboardClient({
  counts, earnings, monthlyRevenue, submissionStats, recentTx,
}: {
  counts:         { users: number; jobs: number; bids: number; projects: number };
  earnings:       { totalFees: number; totalReleased: number; pendingPayouts: number };
  monthlyRevenue: { month: string; fees: number; released: number }[];
  submissionStats: { status: string; total: number }[];
  recentTx:       { id: string; type: string; amount: string; description: string | null; createdAt: string }[];
}) {
  const pieData = submissionStats.map((s) => ({
    name:  statusLabel[s.status] ?? s.status,
    value: Number(s.total),
    color: statusColor[s.status] ?? "#94a3b8",
  }));

  const totalSubmissions = pieData.reduce((s, d) => s + d.value, 0);

  const statCards = [
    { label: "Total Users",       value: counts.users.toLocaleString(),                        icon: Users,         color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Jobs Posted",       value: counts.jobs.toLocaleString(),                         icon: Briefcase,     color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Platform Earnings", value: `$${earnings.totalFees.toFixed(2)}`,                  icon: TrendingUp,    color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Pending Payouts",   value: earnings.pendingPayouts.toString(),                   icon: Clock,         color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
  ];

  const quickActions = [
    { label: "Payment Release", url: "/admin/payments",    icon: ArrowRightLeft, desc: "Release pending payouts" },
    { label: "Transactions",    url: "/admin/transactions", icon: Receipt,        desc: "View all transactions" },
    { label: "Freelancers",     url: "/admin/freelancers",  icon: UserCog,        desc: "Manage freelancers" },
    { label: "Buyers",          url: "/admin/buyers",       icon: UsersIcon,      desc: "Manage buyers" },
    { label: "Jobs",            url: "/admin/jobs",         icon: Briefcase,      desc: "Browse all jobs" },
    { label: "Bids",            url: "/admin/bids",         icon: FileText,       desc: "Review bids" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform overview — all live data.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/payments" className="flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Payment Release
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <div className={`rounded-full p-2 ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {s.label === "Pending Payouts" ? "Awaiting admin release" :
                 s.label === "Platform Earnings" ? "Commission + fees" :
                 s.label === "Jobs Posted" ? `${counts.bids} bids received` :
                 `${counts.projects} active projects`}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly revenue area chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Revenue Overview</h2>
              <p className="text-sm text-muted-foreground">Monthly fees & payouts (last 6 months)</p>
            </div>
          </div>
          {monthlyRevenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No transaction data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="releasedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, name === "fees" ? "Platform Fees" : "Released"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Area type="monotone" dataKey="released" stroke="#3b82f6" strokeWidth={2} fill="url(#releasedGrad)" />
                  <Area type="monotone" dataKey="fees" stroke="#a855f7" strokeWidth={2.5} fill="url(#feesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Submission status pie */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Submissions</h2>
            <p className="text-sm text-muted-foreground">{totalSubmissions} total across all</p>
          </div>
          {pieData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">No submissions yet.</div>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value}`, name]}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent transactions + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent transactions */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/transactions" className="flex items-center gap-1 text-sm">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-border">
            {recentTx.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
            ) : recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${typeColor[tx.type] ?? "bg-muted text-muted-foreground"}`}>
                    {tx.type}
                  </span>
                  <span className="text-sm text-muted-foreground truncate">{tx.description ?? "—"}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-sm font-bold ${tx.type === "fee" ? "text-purple-600" : tx.type === "release" ? "text-blue-600" : "text-foreground"}`}>
                    ${Number(tx.amount).toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.url} href={a.url}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:bg-muted/50 hover:border-primary/30 transition-all group">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
