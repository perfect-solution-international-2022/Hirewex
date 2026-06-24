"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Send, Upload, Link2, FileText, X, Clock, CheckCircle2, RotateCcw } from "lucide-react";
import { submitOrderWorkAction } from "@/app/actions/projects";

const statusConfig = {
  pending: { label: "Awaiting Buyer Review", icon: Clock, className: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20" },
  accepted: { label: "Delivery Accepted", icon: CheckCircle2, className: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20" },
  rejected: { label: "Delivery Rejected", icon: X, className: "text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20" },
  revision_requested: { label: "Revision Requested", icon: RotateCcw, className: "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20" },
} as const;

export function OrderWorkSubmission({
  orderId,
  latestSubmissionStatus,
  latestBuyerNote,
}: {
  orderId: string;
  latestSubmissionStatus: string | null;
  latestBuyerNote: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setDescription(""); setLinkUrl(""); setFile(null); };
  const handleClose = () => { if (isPending) return; reset(); setOpen(false); };

  const handleSubmit = () => {
    if (!description.trim() && !linkUrl.trim() && !file) {
      toast.error("Nothing to submit", { description: "Add a description, a link, or upload a file." });
      return;
    }
    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("description", description);
    formData.append("linkUrl", linkUrl);
    if (file) formData.append("file", file);

    startTransition(async () => {
      const result = await submitOrderWorkAction(formData);
      if (result.success) {
        toast.success("Delivery submitted!", { description: "The buyer will review your work shortly." });
        reset();
        setOpen(false);
      } else {
        toast.error("Submission failed", { description: result.error });
      }
    });
  };

  const canSubmit = !latestSubmissionStatus || latestSubmissionStatus === "revision_requested" || latestSubmissionStatus === "rejected";
  const status = latestSubmissionStatus as keyof typeof statusConfig | null;
  const sc = status ? statusConfig[status] : null;

  return (
    <div className="space-y-3">
      {/* Existing submission status */}
      {sc && (
        <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${sc.className}`}>
          <sc.icon className="h-4 w-4 shrink-0" />
          {sc.label}
        </div>
      )}

      {latestBuyerNote && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Buyer&apos;s note</p>
          <p className="text-foreground">{latestBuyerNote}</p>
        </div>
      )}

      {canSubmit && (
        <Button
          className="w-full gap-2"
          onClick={() => setOpen(true)}
        >
          <Send className="h-4 w-4" />
          {latestSubmissionStatus === "revision_requested" ? "Submit Revision" : latestSubmissionStatus === "rejected" ? "Resubmit Work" : "Submit Delivery"}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Your Delivery</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you've delivered, any notes for the buyer..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none h-28 text-sm"
                disabled={isPending}
              />
            </div>

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
              {isPending ? "Submitting…" : "Submit Delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
