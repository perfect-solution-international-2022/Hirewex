"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, RotateCcw, Link2, FileText,
  Download, Calendar, ClipboardList, Briefcase, Package,
} from "lucide-react";
import { reviewSubmissionAction } from "@/app/actions/projects";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusConfig = {
  pending: { label: "Awaiting Review", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  accepted: { label: "Accepted", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" },
} as const;

const typeConfig = {
  project: { label: "Job Submission", icon: Briefcase, className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  order: { label: "Service Order", icon: Package, className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" },
} as const;

type ReviewAction = "accepted" | "rejected" | "revision_requested";

function ReviewDialog({
  submissionId,
  action,
  open,
  onClose,
}: {
  submissionId: string;
  action: ReviewAction | null;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const handleClose = () => { if (isPending) return; setNote(""); onClose(); };

  const handleConfirm = () => {
    if (!action) return;
    if ((action === "rejected" || action === "revision_requested") && !note.trim()) {
      toast.error("Note required", { description: "Please explain your decision to the freelancer." });
      return;
    }
    startTransition(async () => {
      const result = await reviewSubmissionAction(submissionId, action, note);
      if (result.success) {
        const messages: Record<ReviewAction, string> = {
          accepted: "Work accepted! The freelancer has been notified.",
          rejected: "Submission rejected. The freelancer has been notified.",
          revision_requested: "Revision request sent to the freelancer.",
        };
        toast.success(messages[action]);
        setNote("");
        onClose();
      } else {
        toast.error("Action failed", { description: result.error });
      }
    });
  };

  const config: Record<ReviewAction, { title: string; description: string; confirmLabel: string; confirmClass: string }> = {
    accepted: {
      title: "Accept Submission",
      description: "Mark this work as complete. The freelancer will be notified.",
      confirmLabel: "Accept Work",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    rejected: {
      title: "Reject Submission",
      description: "Reject this submission. Please provide a reason so the freelancer understands.",
      confirmLabel: "Reject",
      confirmClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
    },
    revision_requested: {
      title: "Request Revision",
      description: "Ask the freelancer to revise their work. Describe what needs to change.",
      confirmLabel: "Request Revision",
      confirmClass: "bg-orange-600 hover:bg-orange-700 text-white",
    },
  };

  if (!action) return null;
  const c = config[action];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.description}</DialogDescription>
        </DialogHeader>
        {(action === "rejected" || action === "revision_requested") && (
          <div className="space-y-1.5 py-2">
            <Label htmlFor="note">Your note <span className="text-destructive">*</span></Label>
            <Textarea
              id="note"
              placeholder={action === "revision_requested" ? "Please update the color scheme and fix the typo on page 2..." : "The deliverable doesn't match the original brief because..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-24 text-sm"
              disabled={isPending}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isPending} className={c.confirmClass}>
            {isPending ? "Processing…" : c.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubmittedWorkClient({ submissions }: { submissions: any[] }) {
  const [dialogState, setDialogState] = useState<{ submissionId: string; action: ReviewAction } | null>(null);

  const pending = submissions.filter((s) => s.submission.status === "pending");
  const reviewed = submissions.filter((s) => s.submission.status !== "pending");

  if (submissions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submitted Work</h1>
          <p className="text-muted-foreground mt-1">Review work and deliveries submitted by your freelancers.</p>
        </div>
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No submissions yet</h3>
            <p className="text-muted-foreground max-w-sm">
              When freelancers submit work on your jobs or deliver your service orders, they will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submitted Work</h1>
        <p className="text-muted-foreground mt-1">Review work and deliveries from your freelancers.</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${typeConfig.project.className}`}>
          <Briefcase className="h-3 w-3" /> Job Submission
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${typeConfig.order.className}`}>
          <Package className="h-3 w-3" /> Service Order
        </span>
      </div>

      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Awaiting Review
            <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-1.5">{pending.length}</span>
          </h2>
          <SubmissionList items={pending} onAction={(id, action) => setDialogState({ submissionId: id, action })} />
        </section>
      )}

      {reviewed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Reviews</h2>
          <SubmissionList items={reviewed} onAction={() => {}} />
        </section>
      )}

      <ReviewDialog
        submissionId={dialogState?.submissionId ?? ""}
        action={dialogState?.action ?? null}
        open={!!dialogState}
        onClose={() => setDialogState(null)}
      />
    </div>
  );
}

function SubmissionList({ items, onAction }: { items: any[]; onAction: (id: string, action: ReviewAction) => void }) {
  return (
    <div className="grid gap-4">
      {items.map(({ submission, job, service, freelancer }) => {
        const name = freelancer?.displayName || freelancer?.name || "Freelancer";
        const avatar = freelancer?.avatarUrl || freelancer?.image || "";
        const status = submission.status as keyof typeof statusConfig;
        const sc = statusConfig[status] ?? statusConfig.pending;
        const type = submission.type as keyof typeof typeConfig;
        const tc = typeConfig[type] ?? typeConfig.project;
        const TypeIcon = tc.icon;
        const isPending = status === "pending";

        // Title depends on type
        const contextTitle = type === "project" ? job?.title : service?.title;

        return (
          <Card key={submission.id} className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Type badge — the KEY differentiator */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tc.className}`}>
                      <TypeIcon className="h-3 w-3" /> {tc.label}
                    </span>
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${sc.className}`}>
                      {sc.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-foreground">{contextTitle ?? "Unknown"}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-[10px]">{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>by <span className="font-medium text-foreground">{name}</span></span>
                    <span>·</span>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(submission.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Submission content */}
              <div className="space-y-3">
                {submission.description && (
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {submission.description}
                  </div>
                )}
                {submission.linkUrl && (
                  <a
                    href={submission.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
                  >
                    <Link2 className="h-4 w-4 shrink-0" />
                    {submission.linkUrl}
                  </a>
                )}
                {submission.fileUrl && (
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    View / Download File
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                )}
              </div>

              {/* Buyer note */}
              {submission.buyerNote && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Your note to freelancer</p>
                  <p className="text-foreground">{submission.buyerNote}</p>
                </div>
              )}

              {/* Actions */}
              {isPending && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button onClick={() => onAction(submission.id, "accepted")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Accept
                  </Button>
                  <Button variant="outline" onClick={() => onAction(submission.id, "revision_requested")} className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <RotateCcw className="h-4 w-4" /> Request Revision
                  </Button>
                  <Button variant="outline" onClick={() => onAction(submission.id, "rejected")} className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
