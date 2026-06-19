"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { freelancerNav } from "@/lib/nav";
import { ChevronDown, Trash2, Edit, Loader2, AlertTriangle, ImageIcon, Clock, AlertCircle, CheckCircle2, XCircle, PenLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteServiceAction } from "@/app/actions/services";

const TABS = ["ALL", "ACTIVE", "PENDING APPROVAL", "REQUIRES MODIFICATION", "DRAFT", "DENIED", "PAUSED"] as const;
type Tab = typeof TABS[number];

const STATUS_TO_TAB: Record<string, Exclude<Tab, "ALL">> = {
  approved:              "ACTIVE",
  pending:               "PENDING APPROVAL",
  requires_modification: "REQUIRES MODIFICATION",
  denied:                "DENIED",
  paused:                "PAUSED",
};

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
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
  paused: {
    label: "Paused",
    className: "bg-muted text-muted-foreground border-border",
    icon: null,
  },
};

const TAB_NOTICE: Partial<Record<Tab, { icon: React.ReactNode; title: string; body: string; className: string }>> = {
  "PENDING APPROVAL": {
    icon: <Clock className="h-4 w-4 text-amber-600" />,
    title: "Under review",
    body: "Your service has been submitted and is waiting for admin approval. This usually takes 1–2 business days.",
    className: "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800",
  },
  "REQUIRES MODIFICATION": {
    icon: <AlertCircle className="h-4 w-4 text-blue-600" />,
    title: "Changes requested",
    body: "An admin has reviewed your service and requested modifications. Edit your service and resubmit for approval.",
    className: "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800",
  },
  "DENIED": {
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    title: "Service denied",
    body: "Your service did not meet our marketplace guidelines. You can edit and resubmit, or delete it.",
    className: "bg-destructive/5 border-destructive/20",
  },
};

export default function ClientProjects({ services }: { services: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [acceptingCustom, setAcceptingCustom] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const executeDelete = () => {
    if (!serviceToDelete) return;
    startTransition(async () => {
      await deleteServiceAction(serviceToDelete);
      setServiceToDelete(null);
    });
  };

  // ALL shows everything, other tabs filter by status
  const tabServices = activeTab === "ALL"
    ? services
    : services.filter((s) => (STATUS_TO_TAB[s.status] ?? "PENDING APPROVAL") === activeTab);

  // Count per tab (ALL = total)
  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab] = tab === "ALL"
      ? services.length
      : services.filter(s => (STATUS_TO_TAB[s.status] ?? "PENDING APPROVAL") === tab).length;
    return acc;
  }, {} as Record<Tab, number>);

  const notice = TAB_NOTICE[activeTab];

  return (
    <DashboardShell title="Services" role="freelancer">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 relative">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-light text-foreground">Services</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Accepting Custom Orders</span>
            <button
              onClick={() => setAcceptingCustom(!acceptingCustom)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                acceptingCustom ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${
                acceptingCustom ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>

        {/* Tabs + create */}
        <div className="flex flex-col gap-4 border-b border-border/60 pb-px sm:flex-row sm:items-center sm:justify-between">
          <div className="flex overflow-x-auto hide-scrollbar gap-6 text-sm font-semibold text-muted-foreground">
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
          <Button asChild className="shrink-0 text-xs font-bold uppercase tracking-wide">
            <Link href="/freelancer/new-project">Create a New Service</Link>
          </Button>
        </div>

        {/* Status notice banner — not shown on ALL tab */}
        {notice && tabServices.length > 0 && (
          <div className={`flex items-start gap-3 rounded-xl border p-4 ${notice.className}`}>
            <div className="mt-0.5 shrink-0">{notice.icon}</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{notice.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{notice.body}</p>
            </div>
          </div>
        )}

        {/* Table card */}
        <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/10 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              {activeTab} ({tabServices.length})
            </h2>
            <button className="flex items-center gap-2 rounded-md border border-border/50 bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted/50">
              LAST 30 DAYS <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Column headers — only for ACTIVE tab */}
          {activeTab === "ACTIVE" && (
            <div className="hidden grid-cols-12 gap-4 border-b border-border/50 bg-muted/5 px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground lg:grid">
              <div className="col-span-5">SERVICE</div>
              <div className="col-span-2 text-center">IMPRESSIONS</div>
              <div className="col-span-1 text-center">CLICKS</div>
              <div className="col-span-2 text-center">ORDERS</div>
              <div className="col-span-2 text-right">ACTIONS</div>
            </div>
          )}

          {tabServices.length === 0 ? (
            <div className="px-6 py-16 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">No {activeTab.toLowerCase()} services</p>
              <p className="text-xs text-muted-foreground">
                {activeTab === "ACTIVE" || activeTab === "ALL"
                  ? "Create a new service to get started."
                  : "Nothing here right now."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {tabServices.map((service) => {
                const badge = STATUS_BADGE[service.status];
                const isActiveTab = activeTab === "ACTIVE";
                const needsMod = activeTab === "REQUIRES MODIFICATION";
                // On ALL tab, always show the status badge
                const showBadge = activeTab === "ALL" || (!isActiveTab && badge);

                // Check if we need to show the admin feedback note
                const showAdminNote = service.status === "requires_modification" && (service.adminNote || service.rejectionReason);
                const noteText = service.adminNote || service.rejectionReason; // Adjust based on your DB column name

                return (
                  <div
                    key={service.id}
                    className={`px-6 py-4 hover:bg-muted/10 transition-colors ${
                      isActiveTab
                        ? "grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
                        : "flex items-start gap-4"
                    }`}
                  >
                    {/* Thumbnail + title */}
                    <div className={`flex items-start gap-3 ${isActiveTab ? "col-span-5" : "flex-1 min-w-0"}`}>
                      <div className="h-10 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted mt-1">
                        {service.images && service.images.length > 0 ? (
                          <img src={service.images[0]} alt={service.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/50">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground line-clamp-1">{service.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {new Date(service.createdAt).toLocaleDateString()}
                          </p>
                          {showBadge && badge && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                              {badge.icon} {badge.label}
                            </span>
                          )}
                        </div>

                        {/* --- NEW: ADMIN FEEDBACK BOX --- */}
                        {showAdminNote && (
                          <div className="mt-3 rounded-md bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 w-full max-w-2xl">
                            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5 mb-1.5">
                              <PenLine className="h-3.5 w-3.5" /> Admin Feedback
                            </p>
                            <p className="text-xs text-blue-600/90 dark:text-blue-400/90 whitespace-pre-wrap leading-relaxed">
                              {noteText}
                            </p>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Stats (ACTIVE tab only) */}
                    {isActiveTab && (
                      <>
                        <div className="col-span-2 text-center text-sm font-medium mt-1">0</div>
                        <div className="col-span-1 text-center text-sm font-medium mt-1">0</div>
                        <div className="col-span-2 text-center text-sm font-medium mt-1">0</div>
                      </>
                    )}

                    {/* Actions */}
                    <div className={`flex gap-2 mt-1 ${isActiveTab ? "col-span-2 justify-end" : "ml-auto shrink-0"}`}>
                      {(isActiveTab || needsMod || activeTab === "ALL") && service.status !== "denied" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/freelancer/edit-project/${service.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setServiceToDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Delete modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <Card className="w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Service?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently remove your service from the marketplace. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setServiceToDelete(null)} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={executeDelete} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Yes, Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}