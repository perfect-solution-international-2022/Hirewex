"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase, Clock, DollarSign, CheckCircle2,
  XCircle, AlertCircle, PartyPopper, Search, FileText
} from "lucide-react";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const TABS = ["All", "Pending", "Accepted", "Rejected", "Withdrawn"] as const;
type Tab = typeof TABS[number];

const STATUS_MAP: Record<string, Tab> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  accepted: {
    label: "Hired",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    icon: <PartyPopper className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-muted text-muted-foreground border-border",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function SubmittedBidsClient({ initialBids }: { initialBids: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("All");

  const filtered = useMemo(() => {
    if (activeTab === "All") return initialBids;
    return initialBids.filter(({ bid }) => (STATUS_MAP[bid.status] ?? "Pending") === activeTab);
  }, [initialBids, activeTab]);

  const tabCounts = useMemo(() => {
    return TABS.reduce((acc, tab) => {
      acc[tab] = tab === "All"
        ? initialBids.length
        : initialBids.filter(({ bid }) => (STATUS_MAP[bid.status] ?? "Pending") === tab).length;
      return acc;
    }, {} as Record<Tab, number>);
  }, [initialBids]);

  if (initialBids.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submitted Bids</h1>
          <p className="text-muted-foreground mt-1">Track every proposal you've sent to buyers.</p>
        </div>
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No bids submitted yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Browse open jobs and submit a proposal to get started.
            </p>
            <Button asChild className="mt-2">
              <Link href="/jobs"><Search className="h-4 w-4 mr-2" /> Find Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submitted Bids</h1>
          <p className="text-muted-foreground mt-1">Track every proposal you've sent to buyers.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
          {initialBids.length} total {initialBids.length === 1 ? "bid" : "bids"}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-border/60 text-sm font-semibold text-muted-foreground">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 py-3 transition-colors hover:text-foreground flex items-center gap-2 ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent"
            }`}
          >
            {tab}
            {tabCounts[tab] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm font-medium text-foreground">No {activeTab.toLowerCase()} bids</p>
          <p className="text-xs text-muted-foreground mt-1">Nothing here right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(({ bid, job, buyer, category }) => {
            const badge = STATUS_BADGE[bid.status] ?? STATUS_BADGE.pending;
            const buyerName = buyer?.displayName || buyer?.name || "Client";
            const buyerAvatar = buyer?.avatarUrl || buyer?.image || "";
            const isAccepted = bid.status === "accepted";

            return (
              <Card
                key={bid.id}
                className={`shadow-sm overflow-hidden ${
                  isAccepted ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/5" : "border-border/60"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.className}`}>
                          {badge.icon} {badge.label}
                        </span>
                        {category?.name && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {category.name}
                          </span>
                        )}
                      </div>

                      <Link href={`/jobs/${job.id}`} className="text-xl font-bold text-foreground hover:text-primary transition-colors block">
                        {job.title}
                      </Link>

                      {/* Client info */}
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={buyerAvatar} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {buyerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          Client: <span className="font-medium text-foreground">{buyerName}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-bold text-foreground">
                          <DollarSign className="h-3.5 w-3.5" /> ${Number(bid.amount).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> {bid.deliveryDays} {bid.deliveryDays === 1 ? "day" : "days"} delivery
                        </span>
                        <span className="text-xs">Submitted {formatDate(bid.createdAt)}</span>
                      </div>

                      {bid.coverLetter && (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 bg-muted/30 rounded-lg p-3 border border-border/50">
                          {bid.coverLetter}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2 w-full md:w-auto items-center mt-4 md:mt-0">
                      <Button variant="outline" className="flex-1 md:flex-none" asChild>
                        <Link href={`/jobs/${job.id}`}>
                          <Briefcase className="h-4 w-4 mr-1.5" /> View Job
                        </Link>
                      </Button>
                      {isAccepted && (
                        <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                          <Link href="/freelancer/hired">
                            <PartyPopper className="h-4 w-4 mr-1.5" /> View Hire
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
