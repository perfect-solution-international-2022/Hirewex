"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase, Clock, DollarSign, Star,
  CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Users
} from "lucide-react";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const BID_STATUS: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",  icon: <Clock className="h-3 w-3" /> },
  accepted:  { label: "Accepted",  className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected:  { label: "Rejected",  className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200",            icon: <XCircle className="h-3 w-3" /> },
  withdrawn: { label: "Withdrawn", className: "bg-muted text-muted-foreground border-border",                                            icon: <AlertCircle className="h-3 w-3" /> },
};

export function MyBidsClient({ initialBids }: { initialBids: any[] }) {
  const [bidsData] = useState(initialBids);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const grouped = bidsData.reduce((acc, item) => {
    const jobId = item.job.id;
    if (!acc[jobId]) acc[jobId] = { job: item.job, bids: [] };
    acc[jobId].bids.push(item);
    return acc;
  }, {} as Record<string, { job: any; bids: any[] }>);

  const groups = Object.values(grouped) as { job: any; bids: any[] }[];

  const toggleJob = (jobId: string) => {
    setExpandedJobs(prev => {
      const next = new Set(prev);
      next.has(jobId) ? next.delete(jobId) : next.add(jobId);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bids on My Projects</h1>
          <p className="text-muted-foreground mt-1">Review proposals from freelancers and accept the best fit.</p>
        </div>
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No bids yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Once freelancers start bidding on your projects, their proposals will appear here.
            </p>
            <Button asChild className="mt-2">
              <Link href="/my-projects">View My Projects</Link>
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
          <h1 className="text-3xl font-bold tracking-tight">Bids on My Projects</h1>
          <p className="text-muted-foreground mt-1">Review proposals from freelancers and accept the best fit.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
          {bidsData.length} total {bidsData.length === 1 ? "bid" : "bids"}
        </Badge>
      </div>

      {/* Groups */}
      <div className="space-y-4">
        {groups.map(({ job, bids: jobBids }) => {
          const isExpanded = expandedJobs.has(job.id);
          const pendingCount = jobBids.filter(b => b.bid.status === "pending").length;
          const hasAccepted = jobBids.some(b => b.bid.status === "accepted");

          return (
            <Card key={job.id} className="border-border/60 overflow-hidden shadow-sm">
              {/* Job header */}
              <button
                onClick={() => toggleJob(job.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground truncate">{job.title}</h3>
                      {hasAccepted && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200">
                          Hired
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {jobBids.length} {jobBids.length === 1 ? "bid" : "bids"}
                      </span>
                      {pendingCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="h-3 w-3" /> {pendingCount} pending
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {job.budgetMin && job.budgetMax
                          ? `$${Number(job.budgetMin).toLocaleString()} – $${Number(job.budgetMax).toLocaleString()}`
                          : "Negotiable"}
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {/* Bids list */}
              {isExpanded && (
                <div className="border-t border-border/50 divide-y divide-border/40">
                  {jobBids.map(({ bid, freelancer, profile }) => {
                    const name = freelancer?.displayName || freelancer?.name || "Freelancer";
                    const avatar = profile?.avatarUrl || freelancer?.avatarUrl || freelancer?.image || "";
                    const rating = profile?.rating ? Number(profile.rating).toFixed(1) : null;
                    const jobsDone = profile?.jobsCompleted ?? 0;
                    const badgeConfig = BID_STATUS[bid.status] ?? BID_STATUS.pending;
                    const isAccepted = bid.status === "accepted";
                    const canAccept = bid.status === "pending" && !hasAccepted;

                    return (
                      <div key={bid.id} className={`p-5 ${isAccepted ? "bg-emerald-50/50 dark:bg-emerald-900/5" : ""}`}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                          <Avatar className="h-11 w-11 shrink-0">
                            <AvatarImage src={avatar} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{name}</span>
                              {rating && (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">· {jobsDone} jobs completed</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeConfig.className}`}>
                                {badgeConfig.icon} {badgeConfig.label}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <span className="flex items-center gap-1.5 font-bold text-foreground">
                                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                                ${Number(bid.amount).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {bid.deliveryDays} {bid.deliveryDays === 1 ? "day" : "days"}
                              </span>
                              <span className="text-xs text-muted-foreground">{formatDate(bid.createdAt)}</span>
                            </div>

                            {bid.coverLetter && (
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                                {bid.coverLetter}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex sm:flex-col gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild className="gap-1.5">
                              <Link href={`/profile-preview/${freelancer?.id}`}>
                                View Profile
                              </Link>
                            </Button>
                            {canAccept && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                asChild
                              >
                                <Link href={`/my-bids/${bid.id}/checkout`}>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Accept
                                </Link>
                              </Button>
                            )}
                            {isAccepted && (
                              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 justify-center">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Hired
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
