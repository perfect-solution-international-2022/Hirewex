"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { freelancerNav } from "@/lib/nav";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Briefcase, Clock, DollarSign, Star,
  ArrowUpRight, MoreHorizontal, CheckCircle2, AlertCircle, Calendar,
  Search, ArrowRight,
} from "lucide-react";

// Kept your other hardcoded demo data arrays here...
const earningsData = [
  { month: "Jan", earnings: 1200, target: 1500 },
  { month: "Feb", earnings: 1800, target: 1500 },
  { month: "Mar", earnings: 1500, target: 1600 },
  { month: "Apr", earnings: 2200, target: 1700 },
  { month: "May", earnings: 1950, target: 1800 },
  { month: "Jun", earnings: 2600, target: 2000 },
];

const weeklyActivityData = [
  { day: "Mon", hours: 5.5 },
  { day: "Tue", hours: 7 },
  { day: "Wed", hours: 6.2 },
  { day: "Thu", hours: 8 },
  { day: "Fri", hours: 4.5 },
  { day: "Sat", hours: 2 },
  { day: "Sun", hours: 0.5 },
];

const recentActivity = [
  { id: 1, title: "E-commerce website redesign", client: "Nimal Perera", status: "completed", amount: "LKR 45,000", date: "2 hours ago" },
  { id: 2, title: "Mobile app UI/UX consultation", client: "TechVantage Lanka", status: "in_progress", amount: "LKR 28,500", date: "Yesterday" },
  { id: 3, title: "Logo & brand identity package", client: "Coastal Brews Co.", status: "pending", amount: "LKR 15,000", date: "2 days ago" },
  { id: 4, title: "WordPress maintenance retainer", client: "Sanjeewa Fonseka", status: "completed", amount: "LKR 8,000", date: "3 days ago" },
];

const upcomingDeadlines = [
  { id: 1, title: "Submit homepage wireframes", client: "TechVantage Lanka", due: "Tomorrow, 5:00 PM" },
  { id: 2, title: "Final asset delivery", client: "Coastal Brews Co.", due: "In 3 days" },
  { id: 3, title: "Client review call", client: "Nimal Perera", due: "Jun 18, 10:00 AM" },
];

const statusStyles: Record<string, { label: string; className: string; icon: any }> = {
  completed:   { label: "Completed",  className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900", icon: CheckCircle2 },
  in_progress: { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",   icon: Clock },
  pending:     { label: "Pending",     className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900", icon: AlertCircle },
};

// --- ACCEPT PROPS HERE ---
export default function FreelancerDashboardClient({ projectStatusData }: { projectStatusData: any[] }) {
  
  const totalEarnings = earningsData.reduce((sum, m) => sum + m.earnings, 0);
  
  // Dynamically calculate the total based on the database data!
  const totalProjects = projectStatusData[0]?.name === "No Services" 
    ? 0 
    : projectStatusData.reduce((sum, p) => sum + p.value, 0);

  return (
    <DashboardShell title="Freelancer" role="freelancer" groups={freelancerNav}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <p className="text-sm text-muted-foreground">Here's how your freelance business is performing this month.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Last 6 months
            </Button>
            <Button size="sm" asChild>
              <Link href="/freelancer/new-project" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                New Service
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards — 3 cols + Find Jobs card */}
        <div className="grid gap-4 md:grid-cols-4">

          {/* Rating — moved to first/left */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Rating</p>
              <div className="rounded-full bg-yellow-500/10 p-2">
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">4.9 / 5.0</p>
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < 5 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20"}`} />
              ))}
              <span className="ml-1 text-xs text-muted-foreground">32 reviews</span>
            </div>
          </Card>

          {/* Total Earnings */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
              <div className="rounded-full bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">LKR {totalEarnings.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+18.2% vs last period</span>
            </div>
          </Card>

          {/* Active Bids */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Active Bids</p>
              <div className="rounded-full bg-blue-500/10 p-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">7</p>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>-2 from last week</span>
            </div>
          </Card>

          {/* Find Jobs CTA card */}
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

              <Button
                asChild
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none group"
              >
                <Link href="/jobs" className="flex items-center justify-center gap-1.5">
                  Find Jobs
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </Card>

        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">

          {/* Earnings area chart */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Earnings Overview</h2>
                <p className="text-sm text-muted-foreground">Monthly earnings vs target</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`LKR ${value.toLocaleString()}`, name === "earnings" ? "Earnings" : "Target"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Area type="monotone" dataKey="target" stroke="#cbd5e1" strokeDasharray="4 4" fill="none" strokeWidth={2} />
                  <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2.5} fill="url(#earningsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Project status pie chart */}
          <Card className="p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Service Status</h2>
              <p className="text-sm text-muted-foreground">{totalProjects} total services submitted</p>
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
                    formatter={(value: number, name: string) => [name === "No Services" ? "0" : `${value} services`, name]}
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

          {/* Weekly hours bar chart */}
          <Card className="p-5 lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">Weekly Activity</h2>
              <p className="text-sm text-muted-foreground">Hours logged per day</p>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value} hrs`, "Hours"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent activity */}
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
                <p className="text-sm text-muted-foreground">Your latest project updates</p>
              </div>
              <Button variant="ghost" size="sm" className="text-sm">
                View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {recentActivity.map((item) => {
                const status = statusStyles[item.status];
                const StatusIcon = status.icon;
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
                      <span className={`hidden items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium sm:inline-flex ${status.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>

        {/* Upcoming deadlines */}
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Upcoming Deadlines</h2>
            <p className="text-sm text-muted-foreground">Stay on top of your commitments</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {upcomingDeadlines.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.client}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{item.due}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </DashboardShell>
  );
}