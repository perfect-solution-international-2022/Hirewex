"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitBidAction } from "@/app/actions/bids";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DollarSign, Clock, FileText, Upload,
  X, ChevronRight, Briefcase, User, Tag
} from "lucide-react";

function Field({ label, htmlFor, hint, required, children }: {
  label: string; htmlFor?: string; hint?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function BidForm({ job, buyer, category }: { job: any; buyer: any; category: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const budgetMin = Number(job.budgetMin) || 0;
  const budgetMax = Number(job.budgetMax) || 0;

  const [amount, setAmount]           = useState(budgetMin || 0);
  const [deliveryDays, setDeliveryDays] = useState(7);
  const [coverLetter, setCoverLetter]  = useState("");
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!amount || amount <= 0) {
      toast.error("Amount required", { description: "Please enter your proposed amount." });
      return;
    }
    if (budgetMin && amount < budgetMin) {
      toast.error("Amount too low", { description: `Minimum budget is $${budgetMin.toLocaleString()}.` });
      return;
    }
    if (budgetMax && amount > budgetMax) {
      toast.error("Amount too high", { description: `Maximum budget is $${budgetMax.toLocaleString()}.` });
      return;
    }
    if (deliveryDays < 1) {
      toast.error("Delivery days required", { description: "Enter how many days you need to complete this." });
      return;
    }
    if (!coverLetter.trim()) {
      toast.error("Cover letter required", { description: "Tell the buyer why you're the right person for this job." });
      return;
    }
    if (coverLetter.trim().length < 30) {
      toast.error("Cover letter too short", { description: "Please write at least a few sentences." });
      return;
    }

    const formData = new FormData();
    formData.append("jobId", job.id);
    formData.append("amount", amount.toString());
    formData.append("deliveryDays", deliveryDays.toString());
    formData.append("coverLetter", coverLetter);
    if (portfolioFile) formData.append("portfolio", portfolioFile);

    startTransition(async () => {
      const result = await submitBidAction(formData);
      if (result.success) {
        toast.success("Bid submitted!", { description: "The buyer will review your proposal shortly." });
        router.push(`/jobs/${job.id}`);
      } else {
        toast.error("Failed to submit", { description: result.error });
      }
    });
  };

  const posterName = buyer?.displayName || buyer?.name || "Anonymous";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" /> Submitting proposal for
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
          {job.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> {posterName}
          </span>
          {category?.name && (
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> {category.name}
            </span>
          )}
          {(budgetMin || budgetMax) && (
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Budget: ${budgetMin.toLocaleString()}
              {budgetMax ? ` – $${budgetMax.toLocaleString()}` : "+"}
            </span>
          )}
        </div>
      </div>

      {/* Form card */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-6 sm:p-8 space-y-7">

          {/* Amount */}
          <Field
            label="Your proposed amount"
            htmlFor="amount"
            required
            hint={
              budgetMin && budgetMax
                ? `Client's budget is $${budgetMin.toLocaleString()} – $${budgetMax.toLocaleString()}`
                : budgetMin
                ? `Client's minimum budget is $${budgetMin.toLocaleString()}`
                : "Enter the amount you'd charge for this project."
            }
          >
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="amount"
                  type="number"
                  min={budgetMin || 1}
                  max={budgetMax || undefined}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-7"
                  disabled={isPending}
                />
              </div>

              {/* Slider only if both min and max exist */}
              {budgetMin > 0 && budgetMax > 0 && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={budgetMin}
                    max={budgetMax}
                    step={Math.max(1, Math.floor((budgetMax - budgetMin) / 100))}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isPending}
                    className="w-full accent-primary h-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${budgetMin.toLocaleString()}</span>
                    <span className="font-semibold text-foreground">${Number(amount).toLocaleString()}</span>
                    <span>${budgetMax.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </Field>

          {/* Delivery days */}
          <Field
            label="Delivery time"
            htmlFor="deliveryDays"
            required
            hint="How many days will you need to complete this project?"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deliveryDays"
                  type="number"
                  min={1}
                  max={365}
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(Number(e.target.value))}
                  className="pl-9"
                  disabled={isPending}
                />
              </div>
              <span className="text-sm text-muted-foreground shrink-0">
                {deliveryDays === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Quick pick buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDeliveryDays(d)}
                  disabled={isPending}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    deliveryDays === d
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </Field>

          {/* Cover letter */}
          <Field
            label="Cover letter"
            htmlFor="coverLetter"
            required
            hint="Introduce yourself and explain why you're the best fit for this project."
          >
            <Textarea
              id="coverLetter"
              placeholder="Hi, I'm a skilled developer with 5+ years of experience in... I've worked on similar projects such as... I can deliver this in X days because..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="resize-none h-36 text-sm"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {coverLetter.length} characters
              {coverLetter.length < 30 && coverLetter.length > 0 && (
                <span className="text-amber-500 ml-1">(too short)</span>
              )}
            </p>
          </Field>

          {/* Portfolio PDF (optional) */}
          <Field
            label="Portfolio / CV"
            hint="Optional — upload a PDF showcasing your relevant work or resume."
          >
            <div
              onClick={() => !isPending && fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all cursor-pointer p-6
                ${portfolioFile
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10"
                }
                ${isPending ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {portfolioFile ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{portfolioFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(portfolioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPortfolioFile(null); }}
                    className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload PDF</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF only · max 10 MB</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={isPending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  toast.error("File too large", { description: "Portfolio PDF must be under 10 MB." });
                  return;
                }
                setPortfolioFile(file);
              }}
            />
          </Field>

        </CardContent>
      </Card>

      {/* Summary + submit */}
      <div className="rounded-xl border border-border/60 bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Your proposal</p>
          <p className="text-lg font-bold text-foreground">
            ${Number(amount).toLocaleString()} · {deliveryDays} {deliveryDays === 1 ? "day" : "days"}
          </p>
          {portfolioFile && (
            <p className="text-xs text-primary flex items-center gap-1">
              <FileText className="h-3 w-3" /> Portfolio attached
            </p>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          size="lg"
          className="w-full sm:w-auto gap-2 font-bold"
        >
          {isPending ? "Submitting…" : "Submit Proposal"}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
