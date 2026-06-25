"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Package, DollarSign, Clock,
  CheckCircle2, ChevronRight, ImageIcon, AlertTriangle,
} from "lucide-react";

type RefundRecord = {
  id: string; status: string; reason: string;
  refundAmount: string; serviceFeeRetained: string | null;
  adminNote: string | null;
};

function RefundBanner({ refund }: { refund: RefundRecord }) {
  const cls =
    refund.status === "approved" ? "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/10 dark:border-red-700 dark:text-red-300"
    : refund.status === "rejected" ? "bg-muted border-border text-foreground"
    : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-900/10 dark:border-amber-700 dark:text-amber-300";
  const label =
    refund.status === "approved" ? "Refund Approved — Payment Returned to Buyer"
    : refund.status === "rejected" ? "Refund Request Rejected by Admin"
    : "Refund Pending Admin Review";

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm space-y-1 ${cls}`}>
      <p className="font-semibold flex items-center gap-1.5">
        <AlertTriangle className="h-4 w-4 shrink-0" /> {label}
      </p>
      <p className="opacity-90">{refund.reason}</p>
      <p className="text-xs opacity-75">
        Refund: ${Number(refund.refundAmount).toFixed(2)} · Service fee retained: ${Number(refund.serviceFeeRetained ?? 0).toFixed(2)}
      </p>
      {refund.adminNote && <p className="text-xs opacity-75">Admin note: {refund.adminNote}</p>}
    </div>
  );
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
};

export function OrdersClient({ initialOrders, heldAmount, earnedAmount, refundByOrder = {} }: { initialOrders: any[]; heldAmount: number; earnedAmount: number; refundByOrder?: Record<string, RefundRecord> }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return initialOrders.filter((order) => {
      return (
        order.serviceTitle?.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        order.referenceId?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [initialOrders, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-1">Manage your incoming freelance projects.</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Money Held</p>
            <p className="text-lg font-bold text-amber-600">${heldAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-sm">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Total Earned</p>
            <p className="text-lg font-bold text-emerald-600">${earnedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by service, buyer, or order ID..."
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent py-20 text-center">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 bg-primary/10 flex items-center justify-center rounded-full">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">
              {initialOrders.length === 0 ? "No orders yet" : "No orders match your filters"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {initialOrders.length === 0
                ? "When buyers purchase your services, orders will appear here."
                : "Try adjusting your search or filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((order) => {
            const buyerName = order.buyerDisplayName || order.buyerName || "Guest User";
            const buyerAvatar = order.buyerAvatarUrl || order.buyerImage || "";
            const refund = refundByOrder[order.id] ?? null;

            let coverImage = "";
            try {
              const imgs = typeof order.serviceImages === "string" ? JSON.parse(order.serviceImages) : order.serviceImages;
              if (Array.isArray(imgs) && imgs.length > 0) coverImage = imgs[0];
            } catch {}

            return (
              <div key={order.id} className="space-y-2">
              <Link href={`/freelancer/orders/${order.id}`}>
                <Card className="group border-border/50 hover:border-primary/30 transition-all shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">

                      {/* Thumbnail */}
                      <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                        {coverImage ? (
                          <img src={coverImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/50">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {order.serviceTitle || "Custom Service"}
                          </h3>
                          <Badge variant="outline" className="text-[10px] capitalize shrink-0">
                            {order.tier} tier
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">
                            #{order.referenceId?.substring(0, 8).toUpperCase() || "PENDING"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={buyerAvatar} />
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                {buyerName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {buyerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Price + status */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Earnings</p>
                          <p className="text-lg font-bold text-foreground">
                            ${parseFloat(order.price).toFixed(2)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${STATUS_BADGE.paid.className}`}>
                          {STATUS_BADGE.paid.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              {refund && <RefundBanner refund={refund} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
