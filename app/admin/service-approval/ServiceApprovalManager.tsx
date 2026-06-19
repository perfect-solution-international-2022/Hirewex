"use client";

import { useState, useTransition } from "react";
import { approveService, denyService, requestModification } from "@/app/actions/admin-service-approval";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, XCircle, Clock, Search,
  ChevronRight, ShieldCheck, X, ImageIcon,
  ChevronLeft, ChevronRight as ChevronRightIcon,
  Pencil, Tag, DollarSign, AlignLeft
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function formatDate(d: string | Date | null) {
  if (!d) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function formatPrice(p: string | number) {
  if (!p) return "0";
  return Number(p).toLocaleString();
}

// ── Image carousel ──────────────────────────────────────────────────
function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) {
    return (
      <div className="aspect-video w-full rounded-xl bg-muted/50 border border-dashed border-border flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border/60 bg-muted group">
        <img src={images[idx]} alt="Service" className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i === 0 ? images.length - 1 : i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIdx(i => (i === images.length - 1 ? 0 : i + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full backdrop-blur-sm">
              {idx + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-primary" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Package card ────────────────────────────────────────────────────
function PackageCard({ tier, pkg }: { tier: string; pkg: any }) {
  if (!pkg) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground capitalize">{tier}</span>
        <span className="text-sm font-bold text-foreground">LKR {formatPrice(pkg.price)}</span>
      </div>
      {pkg.description && <p className="text-xs text-muted-foreground">{pkg.description}</p>}
      {pkg.features?.length > 0 && (
        <ul className="space-y-1 pt-1">
          {pkg.features.map((f: string, i: number) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" /> {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
export function ServiceApprovalManager({ initialServices }: { initialServices: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [services, setServices] = useState<any[]>(initialServices);
  const [selected, setSelected]  = useState<any | null>(null);
  const [search, setSearch]      = useState("");
  const [showModInput, setShowModInput] = useState(false);
  const [modNote, setModNote]           = useState("");

  const filtered = services.filter((d) =>
    d.service.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    d.service.category?.toLowerCase().includes(search.toLowerCase())
  );

  const removeService = (id: string) => {
    setServices(prev => prev.filter(d => d.service.id !== id));
    setSelected(null);
    setShowModInput(false);
    setModNote("");
  };

  const handleApprove = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await approveService(selected.service.id);
        toast.success("Service approved", { description: `"${selected.service.title}" is now live on the marketplace.` });
        removeService(selected.service.id);
      } catch (err: any) {
        toast.error("Failed to approve", { description: err.message });
      }
    });
  };

  const handleDeny = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await denyService(selected.service.id);
        toast.success("Service denied", { description: "The freelancer has been notified." });
        removeService(selected.service.id);
      } catch (err: any) {
        toast.error("Failed to deny", { description: err.message });
      }
    });
  };

  const handleRequestMod = () => {
    if (!selected) return;
    if (!modNote.trim()) {
      toast.error("Note required", { description: "Tell the freelancer what needs to be changed." });
      return;
    }
    startTransition(async () => {
      try {
        await requestModification(selected.service.id, modNote.trim());
        toast.success("Modification requested", { description: "The freelancer has been notified with your feedback." });
        removeService(selected.service.id);
      } catch (err: any) {
        toast.error("Failed", { description: err.message });
      }
    });
  };

  // Parse helpers
  const getImages = (s: any): string[] => {
    try {
      const v = typeof s.service.images === "string" ? JSON.parse(s.service.images) : s.service.images;
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  };

  const getPackages = (s: any) => {
    try {
      return typeof s.service.packages === "string" ? JSON.parse(s.service.packages) : s.service.packages;
    } catch { return {}; }
  };

  const displayName = (d: any) => d?.user?.displayName || d?.user?.name || "Freelancer";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Service Approval</h2>
        <p className="text-muted-foreground mt-1">
          Review new freelancer services before they go live on the marketplace.
        </p>
      </div>

      {/* Panel */}
      <div className="flex h-[calc(100vh-14rem)] rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">

        {/* ── LEFT: queue list ──────────────────────────────────── */}
        <div className={`flex flex-col border-r border-border/60 bg-muted/10 transition-all duration-300
          ${selected ? "hidden lg:flex lg:w-80 xl:w-96 shrink-0" : "flex w-full"}`}
        >
          {/* List header */}
          <div className="px-4 py-4 border-b border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Pending approval</h3>
              <Badge variant="secondary" className="tabular-nums">{services.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search title, freelancer, category…"
                className="pl-8 h-8 text-xs bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* List body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  {services.length === 0
                    ? "No pending services — the queue is empty!"
                    : "No results match your search."}
                </p>
              </div>
            ) : (
              filtered.map((data) => {
                const isActive = selected?.service.id === data.service.id;
                const images = getImages(data);
                return (
                  <button
                    key={data.service.id}
                    onClick={() => setSelected(data)}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors
                      ${isActive ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent"}`}
                  >
                    {/* Thumbnail */}
                    <div className="h-12 w-16 rounded-lg overflow-hidden bg-muted border border-border/60 shrink-0">
                      {images[0]
                        ? <img src={images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground/30" /></div>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{data.service.title}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{displayName(data)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {data.service.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(data.service.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: detail panel ───────────────────────────────── */}
        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{selected.service.title}</h3>
                  <p className="text-xs text-muted-foreground">{displayName(selected)} · {selected.service.category}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-5 min-h-full">

                {/* ── Actions + meta column ── */}
                <div className="xl:col-span-2 border-b xl:border-b-0 xl:border-r border-border/50 p-6 space-y-5">

                  {/* Freelancer info */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Freelancer</p>
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shrink-0">
                        {displayName(selected).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName(selected)}</p>
                        <p className="text-xs text-muted-foreground truncate">{selected.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service meta */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Details</p>
                    <div className="rounded-xl border border-border/60 bg-muted/10 divide-y divide-border/50">
                      {[
                        { icon: Tag,      label: "Category",  value: selected.service.category },
                        { icon: Clock,    label: "Submitted", value: formatDate(selected.service.createdAt) },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                            <Icon className="h-3 w-3" /> {label}
                          </span>
                          <span className="text-xs font-medium text-foreground text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Decision</p>

                    {!showModInput ? (
                      <>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                          onClick={handleApprove}
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isPending ? "Processing…" : "Approve & Publish"}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-amber-400"
                          onClick={() => setShowModInput(true)}
                          disabled={isPending}
                        >
                          <Pencil className="h-4 w-4" />
                          Request Modification
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          onClick={handleDeny}
                          disabled={isPending}
                        >
                          <XCircle className="h-4 w-4" />
                          Deny Service
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">What needs to be changed?</p>
                          <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80">
                            Be specific — the freelancer will see this note and needs to know exactly what to fix.
                          </p>
                        </div>
                        <Textarea
                          placeholder="e.g. Your description is too short and doesn't explain what's included. Please also replace the first image — it's blurry."
                          value={modNote}
                          onChange={(e) => setModNote(e.target.value)}
                          className="resize-none text-sm h-28"
                          disabled={isPending}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => { setShowModInput(false); setModNote(""); }}
                            disabled={isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-amber-400"
                            onClick={handleRequestMod}
                            disabled={isPending || !modNote.trim()}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {isPending ? "Sending…" : "Send Feedback"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Review checklist */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Review checklist</p>
                    {[
                      "Title is clear and accurately describes the service",
                      "Description is detailed and professional",
                      "Images are high quality and relevant",
                      "Pricing is reasonable and well-structured",
                      "Category is correctly assigned",
                      "No prohibited content or policy violations",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Content column ── */}
                <div className="xl:col-span-3 p-6 space-y-6">

                  {/* Images */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Images</p>
                    <ImageCarousel images={getImages(selected)} />
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <AlignLeft className="h-3 w-3" /> Description
                    </p>
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {selected.service.description}
                    </div>
                  </div>

                  {/* Packages */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Packages
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(["basic", "standard", "premium"] as const).map((tier) => (
                        <PackageCard key={tier} tier={tier} pkg={getPackages(selected)?.[tier]} />
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state (desktop) */
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select a service to review</p>
              <p className="text-xs text-muted-foreground mt-1">Choose a pending service from the list to approve, request changes, or deny it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}