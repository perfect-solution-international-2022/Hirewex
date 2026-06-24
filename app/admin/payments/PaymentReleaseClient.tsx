"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DollarSign, Briefcase, Package, Calendar, CheckCircle2,
  ArrowRightLeft, Wallet, AlertTriangle, Clock,
} from "lucide-react";
import { releasePaymentAction } from "@/app/actions/admin-payments";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const typeConfig = {
  project: { label: "Job", icon: Briefcase, className: "bg-blue-100 text-blue-700 border-blue-200" },
  order: { label: "Service Order", icon: Package, className: "bg-purple-100 text-purple-700 border-purple-200" },
} as const;

function ReleaseDialog({
  item,
  open,
  onClose,
}: {
  item: any;
  open: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [serviceFee, setServiceFee] = useState("5");
  const [commission, setCommission] = useState("5");

  const gross = Number(item?.grossAmount ?? 0);
  const totalFee = (Number(serviceFee) || 0) + (Number(commission) || 0);
  const feeAmount = +(gross * (totalFee / 100)).toFixed(2);
  const net = +(gross - feeAmount).toFixed(2);

  const handleClose = () => { if (isPending) return; onClose(); };

  const handleRelease = () => {
    if (net <= 0) {
      toast.error("Invalid fees", { description: "Net amount must be greater than zero." });
      return;
    }
    startTransition(async () => {
      const result = await releasePaymentAction(
        item.submissionId,
        Number(serviceFee) || 0,
        Number(commission) || 0
      );
      if (result.success) {
        toast.success(`$${result.netAmount} released to ${item.freelancerName}!`);
        onClose();
      } else {
        toast.error("Release failed", { description: result.error });
      }
    });
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Release Payment</DialogTitle>
          <DialogDescription>
            Set the platform fees and release the freelancer&apos;s earnings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Freelancer</span>
              <span className="font-semibold">{item.freelancerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">For</span>
              <span className="font-semibold truncate max-w-[180px]">{item.contextTitle}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-muted-foreground font-normal">Gross amount</span>
              <span>${gross.toFixed(2)}</span>
            </div>
          </div>

          {/* Fee inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="serviceFee">Service fee (%)</Label>
              <div className="relative">
                <Input
                  id="serviceFee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  className="pr-8"
                  disabled={isPending}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission">Commission (%)</Label>
              <div className="relative">
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  className="pr-8"
                  disabled={isPending}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-lg border border-border divide-y divide-border text-sm">
            <div className="flex justify-between px-4 py-2.5">
              <span className="text-muted-foreground">Gross</span>
              <span>${gross.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 text-red-600">
              <span>Platform fee ({totalFee.toFixed(1)}%)</span>
              <span>− ${feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 font-bold text-emerald-600 text-base">
              <span>Freelancer receives</span>
              <span>${net.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            This is irreversible. The payment will be credited to the freelancer&apos;s balance immediately.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button
            onClick={handleRelease}
            disabled={isPending || net <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            <Wallet className="h-4 w-4" />
            {isPending ? "Releasing…" : `Release $${net.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentReleaseClient({ pending, released }: { pending: any[]; released: any[] }) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Release</h1>
        <p className="text-muted-foreground mt-1">
          Release earnings to freelancers for buyer-accepted work. Set your fees before releasing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Awaiting release</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{released.length}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Released</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">
            ${released.reduce((s, r) => s + Number(r.submission.releasedAmount ?? 0), 0).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">Total paid out</p>
        </Card>
      </div>

      {/* Pending releases */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Awaiting Release
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-1.5">
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-muted-foreground">All payments are up to date.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pending.map((row) => <PaymentRow key={row.submission.id} row={row} onRelease={setSelectedItem} />)}
          </div>
        )}
      </section>

      {/* Released history */}
      {released.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Release History</h2>
          <div className="grid gap-3">
            {released.map((row) => <PaymentRow key={row.submission.id} row={row} onRelease={null} />)}
          </div>
        </section>
      )}

      <ReleaseDialog item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}

function PaymentRow({ row, onRelease }: { row: any; onRelease: ((item: any) => void) | null }) {
  const { submission, job, service, freelancer, buyer, project, serviceOrder } = row;
  const type = submission.type as keyof typeof typeConfig;
  const tc = typeConfig[type] ?? typeConfig.project;
  const TypeIcon = tc.icon;
  const contextTitle = type === "project" ? job?.title : service?.title;
  const grossAmount = type === "project" ? Number(project?.amount ?? 0) : Number(serviceOrder?.price ?? 0);
  const freelancerName = freelancer?.displayName || freelancer?.name || "Freelancer";
  const freelancerAvatar = freelancer?.avatarUrl || freelancer?.image || "";
  const buyerName = buyer?.displayName || buyer?.name || "Buyer";
  const isReleased = !!submission.paymentReleasedAt;

  return (
    <Card className={`shadow-sm ${isReleased ? "opacity-75" : ""}`}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {freelancerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.className}`}>
                  <TypeIcon className="h-3 w-3" /> {tc.label}
                </span>
                {isReleased && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Released
                  </span>
                )}
              </div>
              <p className="font-semibold text-foreground">{contextTitle ?? "—"}</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Freelancer: <span className="font-medium text-foreground">{freelancerName}</span></span>
                <span>Buyer: <span className="font-medium text-foreground">{buyerName}</span></span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(submission.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {isReleased ? "Released" : "Gross"}
              </p>
              <p className="text-lg font-bold text-foreground">
                ${isReleased ? Number(submission.releasedAmount).toFixed(2) : grossAmount.toFixed(2)}
              </p>
              {isReleased && submission.platformFeePercent && (
                <p className="text-xs text-muted-foreground">{submission.platformFeePercent}% fee kept</p>
              )}
            </div>

            {!isReleased && onRelease && (
              <Button
                onClick={() => onRelease({
                  submissionId: submission.id,
                  grossAmount,
                  contextTitle,
                  freelancerName,
                })}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Release
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
