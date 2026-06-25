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
  Download, Calendar, ClipboardList, Briefcase, Package, AlertTriangle, Star, MessageSquare,
} from "lucide-react";
import { reviewSubmissionAction } from "@/app/actions/projects";
import { submitReviewAction } from "@/app/actions/reviews";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const statusConfig = {
  pending:            { label: "Awaiting Review",     className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  accepted:           { label: "Accepted",            className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected:           { label: "Rejected",            className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400" },
} as const;

const typeConfig = {
  project: { label: "Job Submission",  icon: Briefcase, className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  order:   { label: "Service Order",   icon: Package,   className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" },
} as const;

type ReviewAction = "accepted" | "rejected" | "revision_requested";

type ReviewTarget = {
  projectId?:     string;
  serviceOrderId?: string;
  revieweeId:     string;
  revieweeName:   string;
  contextTitle:   string;
};

// ── Star selector ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star className={`h-7 w-7 transition-colors ${i <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

// ── Leave-review dialog ─────────────────────────────────────────────────────────
function LeaveReviewDialog({ target, open, onClose }: { target: ReviewTarget | null; open: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");

  const handleClose = () => { if (isPending) return; setRating(0); setComment(""); onClose(); };

  const handleSubmit = () => {
    if (!target) return;
    if (rating === 0) { toast.error("Please select a star rating."); return; }
    startTransition(async () => {
      const result = await submitReviewAction({
        projectId:      target.projectId,
        serviceOrderId: target.serviceOrderId,
        revieweeId:     target.revieweeId,
        rating,
        comment,
      });
      if (result.success) {
        toast.success("Review submitted! Thank you for your feedback.");
        handleClose();
      } else {
        toast.error(result.error || "Failed to submit review.");
        if (result.error?.includes("already reviewed")) handleClose();
      }
    });
  };

  if (!target) return null;

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            How was your experience with <span className="font-semibold text-foreground">{target.revieweeName}</span> on &ldquo;{target.contextTitle}&rdquo;?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="flex flex-col items-center gap-2 py-2">
            <StarRating value={rating} onChange={setRating} />
            {rating > 0 && (
              <span className="text-sm font-semibold text-amber-600">{ratingLabels[rating]}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Your review <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="review-comment"
              placeholder="Share your experience — quality, communication, delivery..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none h-24 text-sm"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Skip</Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || rating === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
          >
            <Star className="h-4 w-4" />
            {isPending ? "Submitting…" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Submission action dialog (accept / reject / revision) ───────────────────────
function SubmissionActionDialog({
  item, action, open, onClose, onAccepted,
}: {
  item:       any;
  action:     ReviewAction | null;
  open:       boolean;
  onClose:    () => void;
  onAccepted: (target: ReviewTarget) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const handleClose = () => { if (isPending) return; setNote(""); onClose(); };

  const handleConfirm = () => {
    if (!action || !item) return;
    if ((action === "rejected" || action === "revision_requested") && !note.trim()) {
      toast.error("Note required", { description: "Please explain your decision to the freelancer." });
      return;
    }
    startTransition(async () => {
      const result = await reviewSubmissionAction(item.submission.id, action, note);
      if (result.success) {
        const messages: Record<ReviewAction, string> = {
          accepted:           "Work accepted! The freelancer has been notified.",
          rejected:           "Submission rejected. The freelancer has been notified.",
          revision_requested: "Revision request sent to the freelancer.",
        };
        toast.success(messages[action]);
        setNote("");
        onClose();
        if (action === "accepted") {
          const type  = item.submission.type;
          const title = type === "project" ? item.job?.title : item.service?.title;
          const name  = item.freelancer?.displayName || item.freelancer?.name || "Freelancer";
          onAccepted({
            projectId:      item.submission.projectId || undefined,
            serviceOrderId: item.submission.serviceOrderId || undefined,
            revieweeId:     item.freelancer?.id,
            revieweeName:   name,
            contextTitle:   title ?? "the project",
          });
        }
      } else {
        toast.error("Action failed", { description: result.error });
      }
    });
  };

  const config: Record<ReviewAction, { title: string; description: string; warning: string | null; confirmLabel: string; confirmClass: string; needsNote: boolean }> = {
    accepted: {
      title:        "Accept this submission?",
      description:  "The freelancer will be marked as done and notified immediately.",
      warning:      "This cannot be undone. Once accepted, the submission is permanently closed.",
      confirmLabel: "Yes, Accept Work",
      confirmClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
      needsNote:    false,
    },
    rejected: {
      title:        "Reject this submission?",
      description:  "The freelancer will be notified. Please provide a reason so they understand what went wrong.",
      warning:      "This cannot be undone. The freelancer will see this rejection permanently.",
      confirmLabel: "Yes, Reject",
      confirmClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
      needsNote:    true,
    },
    revision_requested: {
      title:        "Request a revision?",
      description:  "The freelancer will be asked to revise their work and can resubmit.",
      warning:      null,
      confirmLabel: "Send Revision Request",
      confirmClass: "bg-orange-600 hover:bg-orange-700 text-white",
      needsNote:    true,
    },
  };

  if (!action || !item) return null;
  const c = config[action];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {c.warning && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{c.warning}</span>
            </div>
          )}
          {c.needsNote && (
            <div className="space-y-1.5">
              <Label htmlFor="note">Your note <span className="text-destructive">*</span></Label>
              <Textarea
                id="note"
                placeholder={action === "revision_requested" ? "Please update the color scheme..." : "The deliverable doesn't match the brief because..."}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none h-24 text-sm"
                disabled={isPending}
              />
            </div>
          )}
        </div>

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

// ── Main client ─────────────────────────────────────────────────────────────────
export function SubmittedWorkClient({
  submissions,
  reviewedProjectIds,
  reviewedOrderIds,
}: {
  submissions:        any[];
  reviewedProjectIds: string[];
  reviewedOrderIds:   string[];
}) {
  const [dialogState,  setDialogState]  = useState<{ item: any; action: ReviewAction } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

  const pending  = submissions.filter((s) => s.submission.status === "pending");
  const reviewed = submissions.filter((s) => s.submission.status !== "pending");

  const isReviewed = (sub: any) =>
    (sub.submission.projectId      && reviewedProjectIds.includes(sub.submission.projectId)) ||
    (sub.submission.serviceOrderId && reviewedOrderIds.includes(sub.submission.serviceOrderId));

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
          <SubmissionList
            items={pending}
            reviewedCheck={isReviewed}
            onAction={(item, action) => setDialogState({ item, action })}
            onReview={(item) => {
              const type  = item.submission.type;
              const title = type === "project" ? item.job?.title : item.service?.title;
              const name  = item.freelancer?.displayName || item.freelancer?.name || "Freelancer";
              setReviewTarget({
                projectId:      item.submission.projectId || undefined,
                serviceOrderId: item.submission.serviceOrderId || undefined,
                revieweeId:     item.freelancer?.id,
                revieweeName:   name,
                contextTitle:   title ?? "the project",
              });
            }}
          />
        </section>
      )}

      {reviewed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Reviews</h2>
          <SubmissionList
            items={reviewed}
            reviewedCheck={isReviewed}
            onAction={() => {}}
            onReview={(item) => {
              const type  = item.submission.type;
              const title = type === "project" ? item.job?.title : item.service?.title;
              const name  = item.freelancer?.displayName || item.freelancer?.name || "Freelancer";
              setReviewTarget({
                projectId:      item.submission.projectId || undefined,
                serviceOrderId: item.submission.serviceOrderId || undefined,
                revieweeId:     item.freelancer?.id,
                revieweeName:   name,
                contextTitle:   title ?? "the project",
              });
            }}
          />
        </section>
      )}

      <SubmissionActionDialog
        item={dialogState?.item ?? null}
        action={dialogState?.action ?? null}
        open={!!dialogState}
        onClose={() => setDialogState(null)}
        onAccepted={(target) => setReviewTarget(target)}
      />

      <LeaveReviewDialog
        target={reviewTarget}
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
      />
    </div>
  );
}

function SubmissionList({
  items, reviewedCheck, onAction, onReview,
}: {
  items:         any[];
  reviewedCheck: (item: any) => boolean;
  onAction:      (item: any, action: ReviewAction) => void;
  onReview:      (item: any) => void;
}) {
  return (
    <div className="grid gap-4">
      {items.map((row) => {
        const { submission, job, service, freelancer } = row;
        const name      = freelancer?.displayName || freelancer?.name || "Freelancer";
        const avatar    = freelancer?.avatarUrl || freelancer?.image || "";
        const status    = submission.status as keyof typeof statusConfig;
        const sc        = statusConfig[status] ?? statusConfig.pending;
        const type      = submission.type as keyof typeof typeConfig;
        const tc        = typeConfig[type] ?? typeConfig.project;
        const TypeIcon  = tc.icon;
        const isPending = status === "pending";
        const isAccepted = status === "accepted";
        const hasReview  = reviewedCheck(row);
        const contextTitle = type === "project" ? job?.title : service?.title;

        return (
          <Card key={submission.id} className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tc.className}`}>
                      <TypeIcon className="h-3 w-3" /> {tc.label}
                    </span>
                    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${sc.className}`}>
                      {sc.label}
                    </span>
                    {isAccepted && hasReview && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
                        <Star className="h-3 w-3 fill-amber-500" /> Reviewed
                      </span>
                    )}
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
                  <a href={submission.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline w-fit">
                    <Link2 className="h-4 w-4 shrink-0" />
                    {submission.linkUrl}
                  </a>
                )}
                {submission.fileUrl && (
                  <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors w-fit">
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
                  <Button onClick={() => onAction(row, "accepted")} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Accept
                  </Button>
                  <Button variant="outline" onClick={() => onAction(row, "revision_requested")}
                    className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                    <RotateCcw className="h-4 w-4" /> Request Revision
                  </Button>
                  <Button variant="outline" onClick={() => onAction(row, "rejected")}
                    className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5">
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}

              {/* Leave review button for accepted items */}
              {isAccepted && !hasReview && (
                <div className="pt-1 border-t border-border/50">
                  <Button variant="outline" size="sm" onClick={() => onReview(row)}
                    className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                    <Star className="h-3.5 w-3.5 fill-amber-500" /> Leave a Review
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
