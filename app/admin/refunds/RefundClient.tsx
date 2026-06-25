"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, DollarSign,
  User, Briefcase, Package, Calendar, AlertCircle,
} from "lucide-react";
import { approveRefund, rejectRefund } from "@/app/actions/refunds";

type Row = {
  refund: {
    id: string; type: string; reason: string;
    refundAmount: string; serviceFeeRetained: string | null;
    status: string; adminNote: string | null;
    createdAt: string; processedAt: string | null;
    projectId: string | null; serviceOrderId: string | null;
    buyerId: string; freelancerId: string;
  };
  buyer: { id: string; name: string | null; displayName: string | null; email: string; avatarUrl: string | null; image: string | null } | null;
  freelancer: { id: string; name: string | null; displayName: string | null; email: string; avatarUrl: string | null; image: string | null } | null;
  project: { id: string; amount: string } | null;
  job: { id: string; title: string } | null;
  serviceOrder: { id: string; price: string; tier: string } | null;
  service: { id: string; title: string } | null;
};

function fmtDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}
function fmtMoney(v: string | number) {
  return `$${Number(v).toFixed(2)}`;
}
function userName(u: { name: string | null; displayName: string | null; email: string } | null) {
  return u?.displayName || u?.name || u?.email || "Unknown";
}
function userAvatar(u: { avatarUrl: string | null; image: string | null } | null) {
  return u?.avatarUrl || u?.image || "";
}

const statusConfig = {
  pending:  { label: "Pending Review",  icon: Clock,          className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Approved",        icon: CheckCircle2,   className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejected",        icon: XCircle,        className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
} as const;

function RefundCard({ row, onApprove, onReject }: { row: Row; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const { refund, buyer: b, freelancer: fl, job, service, serviceOrder } = row;
  const status = statusConfig[refund.status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = status.icon;
  const isProject = !!refund.projectId;
  const title = isProject ? (job?.title ?? "Job Project") : (service?.title ?? "Service Order");

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {isProject
              ? <Briefcase className="h-4 w-4 shrink-0 text-blue-500" />
              : <Package className="h-4 w-4 shrink-0 text-purple-500" />
            }
            <span className="font-semibold text-sm truncate">{title}</span>
          </div>
          <Badge className={`shrink-0 border text-xs font-medium ${status.className}`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        {/* Reason box */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 p-3">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Reason for refund</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{refund.reason}</p>
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Refund Amount</p>
            <p className="font-bold text-base text-emerald-600">{fmtMoney(refund.refundAmount)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Fee Retained</p>
            <p className="font-bold text-base text-amber-600">{fmtMoney(refund.serviceFeeRetained ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
            <p className="font-bold text-base">
              {fmtMoney(Number(refund.refundAmount) + Number(refund.serviceFeeRetained ?? 0))}
            </p>
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Buyer (to refund)", user: b },
            { label: "Freelancer",        user: fl },
          ].map(({ label, user }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
              <Avatar className="h-7 w-7 border border-border shrink-0">
                <AvatarImage src={userAvatar(user)} />
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {(user?.name || user?.email || "?")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-xs font-medium truncate">{userName(user)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Date & admin note */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Flagged {fmtDate(refund.createdAt)}</span>
          {refund.processedAt && <span>Processed {fmtDate(refund.processedAt)}</span>}
        </div>

        {refund.adminNote && (
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Admin note: </span>{refund.adminNote}
          </div>
        )}

        {/* Actions */}
        {refund.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => onApprove(refund.id)}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve Refund
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
              onClick={() => onReject(refund.id)}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RefundClient({ rows }: { rows: Row[] }) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [isPending, startTransition] = useTransition();

  // Approve dialog
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveNote, setApproveNote] = useState("");

  // Reject dialog
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const byTab = rows.filter(r => r.refund.status === tab);
  const counts = {
    pending:  rows.filter(r => r.refund.status === "pending").length,
    approved: rows.filter(r => r.refund.status === "approved").length,
    rejected: rows.filter(r => r.refund.status === "rejected").length,
  };

  function handleApprove(id: string) {
    setApproveId(id);
    setApproveNote("");
  }
  function handleReject(id: string) {
    setRejectId(id);
    setRejectNote("");
  }

  function confirmApprove() {
    if (!approveId) return;
    startTransition(async () => {
      try {
        await approveRefund(approveId, approveNote || undefined);
        toast.success("Refund approved and buyer notified.");
        setApproveId(null);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  function confirmReject() {
    if (!rejectId) return;
    if (!rejectNote.trim()) { toast.error("Please provide a reason for rejection."); return; }
    startTransition(async () => {
      try {
        await rejectRefund(rejectId, rejectNote);
        toast.success("Refund request rejected.");
        setRejectId(null);
      } catch (e: any) {
        toast.error(e.message);
      }
    });
  }

  const tabs = [
    { key: "pending",  label: "Pending",  count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      {counts.pending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {counts.pending} refund{counts.pending !== 1 ? "s" : ""} awaiting your review
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
              These are flagged due to freelancers failing to deliver work on time. Service fees are non-refundable.
            </p>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/40 border border-border/60 p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background shadow text-foreground border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                t.key === "pending" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {byTab.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mb-4 opacity-30" />
          <p className="font-medium">No {tab} refund requests</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {byTab.map(row => (
            <RefundCard
              key={row.refund.id}
              row={row}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Approve dialog */}
      <Dialog open={!!approveId} onOpenChange={v => { if (!v) setApproveId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Refund</DialogTitle>
            <DialogDescription>
              This will notify the buyer and freelancer. Process the actual refund through your payment gateway (OnePay) separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">Admin note (optional)</p>
            <Textarea
              placeholder="Any note for your records…"
              value={approveNote}
              onChange={e => setApproveNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveId(null)} disabled={isPending}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmApprove} disabled={isPending}>
              Confirm Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={v => { if (!v) setRejectId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              The buyer and freelancer will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">Reason for rejection <span className="text-red-500">*</span></p>
            <Textarea
              placeholder="Explain why this refund is being rejected…"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)} disabled={isPending}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={isPending}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
