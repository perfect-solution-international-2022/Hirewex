"use client";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buyerNav } from "@/lib/nav"; // Assuming you have a buyerNav for the side panel
import Link from "next/link";

import {
  TrendingUp, TrendingDown, Briefcase, Clock, DollarSign, Star,
  ArrowUpRight, MoreHorizontal, CheckCircle2, AlertCircle, Calendar,
  Search, ArrowRight,
} from "lucide-react";

// You can keep similar activity data structures here or fetch them via props
const recentActivity = [
  { id: 1, title: "New proposal received", client: "Nimal Perera", status: "pending", amount: "LKR 45,000", date: "2 hours ago" },
  { id: 2, title: "Payment milestone approved", client: "TechVantage Lanka", status: "completed", amount: "LKR 28,500", date: "Yesterday" },
];

const statusStyles: Record<string, { label: string; className: string; icon: any }> = {
  completed:   { label: "Completed",  className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900", icon: CheckCircle2 },
  pending:     { label: "Pending",    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900", icon: AlertCircle },
};

export default function UserDashboardClient() {
  return (
    <DashboardShell title="Buyer Dashboard" role="buyer">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Buyer Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your projects and track talent progress.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/post-projects" className="flex items-center">
                <Briefcase className="mr-2 h-4 w-4" />
                Post a Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
            <p className="mt-2 text-2xl font-bold">3</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
            <p className="mt-2 text-2xl font-bold">LKR 125,000</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Pending Bids</p>
            <p className="mt-2 text-2xl font-bold">8</p>
          </Card>
          <Card className="relative overflow-hidden p-5 bg-slate-900 border-slate-800">
            <div className="relative flex flex-col h-full justify-between gap-2">
              <p className="text-sm font-bold text-white">Find Freelancers</p>
              <Button asChild size="sm" variant="secondary" className="w-full">
                <Link href="/service">Browse</Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="space-y-1">
            {recentActivity.map((item) => {
              const status = statusStyles[item.status];
              const StatusIcon = status.icon;
              return (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.client} · {item.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${status.className}`}>
                     {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}