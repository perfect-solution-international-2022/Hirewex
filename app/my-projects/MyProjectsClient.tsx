"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import {
  Briefcase, Plus, Clock, Users, Pencil,
  CheckCircle2, XCircle, AlertCircle, PenLine
} from "lucide-react";

const TABS = ["ALL", "ACTIVE", "PENDING APPROVAL", "REQUIRES MODIFICATION", "DENIED"] as const;
type Tab = typeof TABS[number];

const APPROVAL_TO_TAB: Record<string, Exclude<Tab, "ALL">> = {
  approved:              "ACTIVE",
  pending:               "PENDING APPROVAL",
  requires_modification: "REQUIRES MODIFICATION",
  denied:                "DENIED",
};

const APPROVAL_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  approved: {
    label: "Live",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: <Clock className="h-3 w-3" />,
  },
  requires_modification: {
    label: "Needs changes",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: <PenLine className="h-3 w-3" />,
  },
  denied: {
    label: "Denied",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const TAB_NOTICE: Partial<Record<Tab, { icon: React.ReactNode; title: string; body: string; className: string; showNote?: boolean }>> = {
  "PENDING APPROVAL": {
    icon: <Clock className="h-4 w-4 text-amber-600" />,
    title: "Under review",
    body: "Your job has been submitted and is waiting for admin approval. This usually takes 1–2 business days.",
    className: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800",
  },
  "REQUIRES MODIFICATION": {
    icon: <AlertCircle className="h-4 w-4 text-blue-600" />,
    title: "Changes requested",
    body: "An admin has reviewed your job and requested modifications. Edit your job and resubmit for approval.",
    className: "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800",
    showNote: true,
  },
  "DENIED": {
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    title: "Job denied",
    body: "Your job did not meet our marketplace guidelines. You can edit and resubmit, or delete it.",
    className: "bg-destructive/5 border-destructive/20",
  },
};

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return "Negotiable";
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  if (min) return `$${Number(min).toLocaleString()}`;
  return `$${Number(max!).toLocaleString()}`;
}

export function MyProjectsClient({ jobs }: { jobs: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");

  const tabJobs = activeTab === "ALL"
    ? jobs
    : jobs.filter((j) => (APPROVAL_TO_TAB[j.approvalStatus ?? "pending"] ?? "PENDING APPROVAL") === activeTab);

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === "ALL"
      ? jobs.length
      : jobs.filter(j => (APPROVAL_TO_TAB[j.approvalStatus ?? "pending"] ?? "PENDING APPROVAL") === tab).length;
    return acc;
  }, {} as Record<Tab, number>);

  const notice = TAB_NOTICE[activeTab];

  // Collect admin notes for requires_modification jobs (shown per-card)
  const notesMap = jobs.reduce((acc, j) => {
    if (j.approvalStatus === "requires_modification" && j.adminNote) {
      acc[j.id] = j.adminNote;
    }
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Posted Projects</h1>
          <p className="text-muted-foreground mt-1">Manage the jobs you've posted and review incoming bids.</p>
        </div>
        <Button asChild>
          <Link href="/post-projects">
            <Plus className="mr-2 h-4 w-4" /> Post New Project
          </Link>
        </Button>
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

      {/* Notice banner */}
      {notice && tabJobs.length > 0 && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${notice.className}`}>
          <div className="mt-0.5 shrink-0">{notice.icon}</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{notice.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{notice.body}</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {tabJobs.length === 0 ? (
        jobs.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent py-20 text-center">
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">You haven't posted any projects yet</h3>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto mb-6">
                Ready to hire? Post your first project to start receiving bids from top freelancers.
              </p>
              <Button asChild size="lg">
                <Link href="/post-projects">Post a Project Now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">No {activeTab.toLowerCase()} jobs</p>
            <p className="text-xs text-muted-foreground mt-1">Nothing here right now.</p>
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {tabJobs.map((job) => {
            const badge = APPROVAL_BADGE[job.approvalStatus ?? "pending"];
            const isApproved = job.approvalStatus === "approved";
            const needsMod = job.approvalStatus === "requires_modification";
            const adminNote = notesMap[job.id];

            return (
              <Card key={job.id} className="group transition-all hover:border-primary/50 hover:shadow-md bg-card">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                    {/* Job details */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold">{job.title}</h3>

                        {/* Job status (open/in_progress etc) — only show if approved */}
                        {isApproved && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            job.status === "open"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900"
                              : job.status === "in_progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900"
                              : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace("_", " ")}
                          </span>
                        )}

                        {/* Approval badge — always show */}
                        {badge && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                            {badge.icon} {badge.label}
                          </span>
                        )}
                      </div>

                      {/* Admin note for requires_modification */}
                      {needsMod && adminNote && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 p-3">
                          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">Admin feedback</p>
                            <p className="text-xs text-blue-600/80 dark:text-blue-500/80 leading-relaxed">{adminNote}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Briefcase className="h-3.5 w-3.5" />
                          {formatBudget(job.budgetMin, job.budgetMax)}
                        </span>
                        {isApproved && (
                          <span className="flex items-center gap-1.5 text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md">
                            <Users className="h-3.5 w-3.5" />
                            {job.bidCount ?? 0} bids
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2 w-full md:w-auto items-center mt-4 md:mt-0">
                      {isApproved && (
                        <Button variant="outline" className="flex-1 md:flex-none" asChild>
                          <Link href={`/jobs/${job.id}`}>View</Link>
                        </Button>
                      )}
                      {(isApproved || needsMod) && (
                        <Button className="flex-1 md:flex-none" asChild>
                          <Link href={`/my-projects/${job.id}/edit`}>
                            Edit <Pencil className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <DeleteJobButton jobId={job.id} />
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
