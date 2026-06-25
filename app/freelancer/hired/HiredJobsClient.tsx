"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Briefcase, Clock, DollarSign, CheckCircle2,
  MessageCircle, PartyPopper, Calendar, Upload, Link2,
  FileText, X, Send, RotateCcw, AlertTriangle,
} from "lucide-react";
import { submitWorkAction } from "@/app/actions/projects";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function SubmitWorkDialog({
  bidId,
  jobId,
  open,
  onClose,
}: {
  bidId: string;
  jobId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setDescription("");
    setLinkUrl("");
    setFile(null);
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!description.trim() && !linkUrl.trim() && !file) {
      toast.error("Nothing to submit", { description: "Add a description, a link, or upload a file." });
      return;
    }

    const formData = new FormData();
    formData.append("bidId", bidId);
    formData.append("jobId", jobId);
    formData.append("description", description);
    formData.append("linkUrl", linkUrl);
    if (file) formData.append("file", file);

    startTransition(async () => {
      const result = await submitWorkAction(formData);
      if (result.success) {
        toast.success("Work submitted!", { description: "The buyer will review your submission shortly." });
        reset();
        onClose();
      } else {
        toast.error("Submission failed", { description: result.error });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Your Work</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you've completed, any notes for the buyer, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none h-28 text-sm"
              disabled={isPending}
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label htmlFor="linkUrl">
              <span className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> Link (optional)</span>
            </Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Google Drive, Dropbox, GitHub, Figma, etc.</p>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label>
              <span className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> File (optional)</span>
            </Label>
            <div
              onClick={() => !isPending && fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-5
                ${file ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"}
                ${isPending ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {file ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Image, PDF, ZIP · max 15 MB</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,application/zip,.zip,.rar,.7z"
              className="sr-only"
              disabled={isPending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 15 * 1024 * 1024) {
                  toast.error("File too large", { description: "Max file size is 15 MB." });
                  return;
                }
                setFile(f);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
            <Send className="h-4 w-4" />
            {isPending ? "Submitting…" : "Submit Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RefundRecord = {
  id: string; status: string; reason: string;
  refundAmount: string; serviceFeeRetained: string | null;
  adminNote: string | null; createdAt: string;
};

function RefundBanner({ refund }: { refund: RefundRecord }) {
  const s = refund.status === "approved"
    ? { label: "Refund Approved — Payment Returned to Buyer", cls: "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/10 dark:border-red-700 dark:text-red-300" }
    : refund.status === "rejected"
    ? { label: "Refund Request Rejected by Admin",            cls: "bg-muted border-border text-foreground" }
    : { label: "Refund Pending Admin Review",                  cls: "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/10 dark:border-amber-700 dark:text-amber-300" };

  return (
    <div className={`mt-4 rounded-lg border px-4 py-3 text-sm space-y-1 ${s.cls}`}>
      <p className="font-semibold flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 shrink-0" /> {s.label}
      </p>
      <p className="opacity-90">{refund.reason}</p>
      <p className="text-xs opacity-75">
        Refund amount: ${Number(refund.refundAmount).toFixed(2)} · Service fee retained: ${Number(refund.serviceFeeRetained ?? 0).toFixed(2)}
      </p>
      {refund.adminNote && <p className="text-xs opacity-75">Admin note: {refund.adminNote}</p>}
    </div>
  );
}

export function HiredJobsClient({ hiredJobs, refundByProject = {} }: { hiredJobs: any[]; refundByProject?: Record<string, RefundRecord> }) {
  const [openDialogBidId, setOpenDialogBidId] = useState<string | null>(null);

  if (hiredJobs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hired Jobs</h1>
          <p className="text-muted-foreground mt-1">Projects you&apos;ve been hired for will appear here.</p>
        </div>
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">No hires yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Once a buyer accepts one of your proposals, the project will show up here.
            </p>
            <Button asChild className="mt-2">
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hired Jobs</h1>
          <p className="text-muted-foreground mt-1">Projects you&apos;ve been hired for.</p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
          {hiredJobs.length} active {hiredJobs.length === 1 ? "hire" : "hires"}
        </Badge>
      </div>

      <div className="grid gap-4">
        {hiredJobs.map(({ bid, job, buyer, category, project }) => {
          const buyerName = buyer?.displayName || buyer?.name || "Client";
          const buyerAvatar = buyer?.avatarUrl || buyer?.image || "";
          const projectStatus = project?.status ?? "active";
          const isOpen = openDialogBidId === bid.id;
          const refund = project ? refundByProject[project.id] ?? null : null;

          return (
            <Card key={bid.id} className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/5 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">

                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200">
                        <PartyPopper className="h-3 w-3" /> Hired
                      </span>
                      {projectStatus === "submitted" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200">
                          <Clock className="h-3 w-3" /> Under Review
                        </span>
                      )}
                      {projectStatus === "completed" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {category?.name && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {category.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-foreground">{job.title}</h3>

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
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" /> Hired {formatDate(bid.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 md:flex-none" asChild>
                        <Link href={`/jobs/${job.id}`}>
                          <Briefcase className="h-4 w-4 mr-1.5" /> Job Details
                        </Link>
                      </Button>
                      <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
                        <Link href={`/chat`}>
                          <MessageCircle className="h-4 w-4 mr-1.5" /> Message Client
                        </Link>
                      </Button>
                    </div>

                    {/* Submit Work button */}
                    {projectStatus === "active" && (
                      <Button
                        variant="outline"
                        className="w-full border-primary/40 text-primary hover:bg-primary/5"
                        onClick={() => setOpenDialogBidId(bid.id)}
                      >
                        <Send className="h-4 w-4 mr-1.5" /> Submit Work
                      </Button>
                    )}
                    {projectStatus === "submitted" && (
                      <Button variant="outline" className="w-full" disabled>
                        <Clock className="h-4 w-4 mr-1.5" /> Awaiting Buyer Review
                      </Button>
                    )}
                    {projectStatus === "completed" && (
                      <Button variant="outline" className="w-full text-blue-600 border-blue-200" disabled>
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Work Accepted
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>

              {refund && (
                <div className="px-6 pb-5">
                  <RefundBanner refund={refund} />
                </div>
              )}

              <SubmitWorkDialog
                bidId={bid.id}
                jobId={job.id}
                open={isOpen}
                onClose={() => setOpenDialogBidId(null)}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
