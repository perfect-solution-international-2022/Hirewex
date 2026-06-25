"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requestWithdrawal } from "@/app/actions/wallet";
import Link from "next/link";
import {
  Wallet, ArrowDownToLine, TrendingUp, Clock, CheckCircle2,
  XCircle, Banknote, AlertCircle, ChevronRight, ArrowUpRight, ArrowDownLeft,
  Loader2,
} from "lucide-react";

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}

export function WalletClient({
  totalEarned, totalWithdrawn, totalPending, available,
  transactions, withdrawals, bankDetails,
}: {
  totalEarned: number; totalWithdrawn: number; totalPending: number; available: number;
  transactions: any[]; withdrawals: any[];
  bankDetails: { bankName: string | null; bankAccountHolder: string | null; bankAccountNumber: string | null; bankBranch: string | null } | null;
}) {
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasBankDetails = !!bankDetails?.bankAccountNumber;

  const handleWithdraw = () => {
    const num = parseFloat(amount);
    if (!num || num < 10) { setMsg({ type: "error", text: "Minimum withdrawal is $10." }); return; }
    if (num > available) { setMsg({ type: "error", text: `Max available is $${available.toFixed(2)}.` }); return; }
    setMsg(null);
    startTransition(async () => {
      const res = await requestWithdrawal(num);
      if (res.success) {
        setMsg({ type: "success", text: "Withdrawal request submitted! Admin will process it shortly." });
        setAmount("");
      } else {
        setMsg({ type: "error", text: res.error ?? "Something went wrong." });
      }
    });
  };

  // Merge and sort transaction history
  const history = [
    ...transactions.map((t) => ({ ...t, kind: "tx" as const })),
    ...withdrawals.map((w) => ({ ...w, kind: "wd" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 60);

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Balance cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available",     value: available,      color: "text-emerald-600", icon: <Wallet className="h-5 w-5" />, highlight: true },
          { label: "Total Earned",  value: totalEarned,    color: "text-foreground",  icon: <TrendingUp className="h-5 w-5" /> },
          { label: "Withdrawn",     value: totalWithdrawn, color: "text-foreground",  icon: <ArrowDownToLine className="h-5 w-5" /> },
          { label: "Pending",       value: totalPending,   color: "text-amber-600",   icon: <Clock className="h-5 w-5" /> },
        ].map(({ label, value, color, icon, highlight }) => (
          <Card key={label} className={`border-border/50 shadow-sm ${highlight ? "ring-2 ring-emerald-500/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {icon}
                <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${color}`}>${value.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Withdrawal request */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowDownToLine className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-bold text-base">Request Withdrawal</h2>
            </div>

            {!hasBankDetails ? (
              <div className="rounded-xl border border-dashed border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10 p-4 flex flex-col gap-3">
                <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">No bank details saved</p>
                </div>
                <p className="text-xs text-muted-foreground">You need to add your bank account before you can request a withdrawal.</p>
                <Button variant="outline" size="sm" asChild className="w-fit">
                  <Link href="/settings/profile">Add Bank Details <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bank preview */}
                <div className="rounded-lg bg-muted/40 border border-border/40 p-3 text-sm space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">Paying to</p>
                  <p className="font-medium">{bankDetails.bankName}</p>
                  <p className="text-muted-foreground">{bankDetails.bankAccountHolder}</p>
                  <p className="font-mono text-xs">{bankDetails.bankAccountNumber}</p>
                  {bankDetails.bankBranch && <p className="text-muted-foreground text-xs">{bankDetails.bankBranch}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      type="number"
                      min="10"
                      max={available}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Max $${available.toFixed(2)}`}
                      className="w-full pl-7 pr-3 h-10 rounded-md border border-input bg-background text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      disabled={isPending || available <= 0}
                    />
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[25, 50, 100].filter(v => v <= available).map((v) => (
                      <button key={v} type="button" onClick={() => setAmount(String(v))}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                        ${v}
                      </button>
                    ))}
                    {available >= 10 && (
                      <button type="button" onClick={() => setAmount(available.toFixed(2))}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary hover:text-primary transition-colors">
                        Max
                      </button>
                    )}
                  </div>
                </div>

                {msg && (
                  <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${msg.type === "success" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"}`}>
                    {msg.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                    {msg.text}
                  </div>
                )}

                <Button
                  onClick={handleWithdraw}
                  disabled={isPending || available <= 0 || !amount}
                  className="w-full"
                >
                  {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</> : "Request Withdrawal"}
                </Button>

                {available <= 0 && (
                  <p className="text-xs text-center text-muted-foreground">No available balance to withdraw.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending withdrawals */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <h2 className="font-bold text-base">Pending Requests</h2>
            </div>

            {withdrawals.filter(w => w.status === "pending").length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.filter(w => w.status === "pending").map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div>
                      <p className="text-sm font-bold text-amber-600">-${Number(w.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(w.createdAt)}</p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unified history */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Transaction History</h2>
          <span className="text-xs text-muted-foreground">{history.length} entries</span>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Banknote className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground">Earnings and withdrawals will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {history.map((item) => {
              const isTx = item.kind === "tx";
              const isCredit = isTx && (item.type === "release" || item.type === "deposit");
              return (
                <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/20"}`}>
                      {isCredit
                        ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                        : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {isTx ? (item.description ?? `Payment — ${item.type}`) : "Withdrawal request"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`text-sm font-bold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                      {isCredit ? "+" : "-"}${Number(item.amount).toFixed(2)}
                    </p>
                    {!isTx && <StatusBadge status={item.status} />}
                    {isTx && <span className="text-[10px] text-muted-foreground capitalize">{item.type}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

    </div>
  );
}
