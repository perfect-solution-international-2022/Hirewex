"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, Briefcase, Clock, DollarSign, Star,
  ArrowUpRight, CheckCircle2, AlertCircle, Calendar,
  Search, ArrowRight, Package, Inbox,
} from "lucide-react";

const statusStyles: Record<string, { label: string; className: string; icon: any }> = {
  completed:   { label: "Completed",   className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",   icon: CheckCircle2 },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",     icon: Clock },
  pending:     { label: "Pending",     className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900", icon: AlertCircle },
  submitted:   { label: "Submitted",   className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900", icon: Package },
};

interface Props {
  projectStatusData: { name: string; value: number; color: string }[];
  totalEarnings: number;
  activeBidCount: number;
  rating: string | null;
  reviewCount: number;
  monthlyEarnings: { month: string; earnings: number }[];
  weekActivity: { day: string; orders: number; revenue: number }[];
  recentActivity: { id: string; title: string; client: string; status: string; amount: string; date: string }[];
  upcomingDeadlines: { id: string; title: string; client: string; due: string }[];
}

export default function FreelancerDashboardClient({
  projectStatusData,
  totalEarnings,
  activeBidCount,
  rating,
  reviewCount,
  monthlyEarnings,
  weekActivity,
  recentActivity,
  upcomingDeadlines,
}: Props) {
  const totalServices = projectStatusData[0]?.name === "No Services"
    ? 0
    : projectStatusData.reduce((s, p) => s + p.value, 0);

  const hasEarnings = monthlyEarnings.some((m) => m.earnings > 0);
  const hasActivity = weekActivity.some((d) => d.orders > 0);

  return (
    <DashboardShell title="Freelancer" role="freelancer">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground">Here&apos;s how your freelance business is performing.</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/freelancer/new-project" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              New Service
            </Link>
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-4">

          {/* Rating */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Rating</p>
              <div className="rounded-full bg-yellow-500/10 p-2">
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            {rating ? (
              <>
                <p className="mt-2 text-2xl font-bold text-foreground">{rating} / 5.0</p>
                <div className="mt-1 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < Math.round(Number(rating)) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">{reviewCount} {reviewCount === 1 ? "review" : "reviews"}</span>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl font-bold text-foreground">—</p>
                <p className="mt-1 text-xs text-muted-foreground">No reviews yet</p>
              </>
            )}
          </Card>

          {/* Total Earnings */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              USD {totalEarnings.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">From paid service orders</p>
          </Card>

          {/* Active Bids */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Active Bids</p>
              <div className="rounded-full bg-blue-500/10 p-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{activeBidCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeBidCount === 0 ? "No pending bids" : "Awaiting buyer response"}
            </p>
          </Card>

          {/* Find Jobs CTA */}
          <Card className="relative overflow-hidden p-5 bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),_transparent_60%)]" />
            <div className="relative flex flex-col h-full justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full bg-primary/20 p-2">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <p className="text-base font-bold text-white leading-snug">Ready for your next project?</p>
                <p className="mt-1 text-xs text-slate-400">Browse open jobs and place your bid.</p>
              </div>
              <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none group">
                <Link href="/jobs" className="flex items-center justify-center gap-1.5">
                  Find Jobs <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </Card>

        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Monthly earnings area chart */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Earnings Overview</h2>
                <p className="text-sm text-muted-foreground">Monthly earnings (last 6 months)</p>
              </div>
              {hasEarnings && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>USD {totalEarnings.toLocaleString()} total</span>
                </div>
              )}
            </div>
            {hasEarnings ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyEarnings} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
                    <Tooltip
                      formatter={(v: any) => [`USD ${Number(v).toLocaleString()}`, "Earnings"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2.5} fill="url(#earningsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10">
                <DollarSign className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No earnings yet — complete your first order to see data here.</p>
              </div>
            )}
          </Card>

          {/* Service status pie */}
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Service Status</h2>
              <p className="text-sm text-muted-foreground">{totalServices} total services</p>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectStatusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                    {projectStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [name === "No Services" ? "0" : `${v}`, name]}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {projectStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.name === "No Services" ? 0 : item.value}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Activity row */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Orders this week bar chart */}
          <Card className="p-5 lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">This Week</h2>
              <p className="text-sm text-muted-foreground">Revenue per day (paid orders)</p>
            </div>
            {hasActivity ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : `${v}`} />
                    <Tooltip
                      formatter={(v: any) => [`USD ${Number(v).toLocaleString()}`, "Revenue"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                    />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10">
                <p className="text-sm text-muted-foreground">No orders this week yet.</p>
              </div>
            )}
          </Card>

          {/* Recent activity */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Latest orders and projects</p>
              </div>
              <Button variant="ghost" size="sm" className="text-sm" asChild>
                <Link href="/freelancer/orders">View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((item) => {
                  const s = statusStyles[item.status] ?? statusStyles.pending;
                  const StatusIcon = s.icon;
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted sm:flex">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.client} · {item.date}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">{item.amount}</span>
                        <span className={`hidden items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium sm:inline-flex ${s.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

        </div>

        {/* Upcoming work */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Active Projects</h2>
            <p className="text-sm text-muted-foreground">Hired jobs currently in progress</p>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No active projects right now.</p>
              <Button variant="outline" size="sm" asChild className="mt-1">
                <Link href="/jobs">Browse open jobs</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                  <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.client}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{item.due}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </DashboardShell>
  );
}
