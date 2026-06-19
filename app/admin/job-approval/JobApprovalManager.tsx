"use client";

import { useState, useTransition } from "react";
import { approveJob, denyJob, requestJobModification } from "@/app/actions/admin-job-approval";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, Clock, Search,
  ChevronRight, ShieldCheck, X,
  Pencil, Tag, DollarSign, Briefcase,
  Calendar, MapPin, Users, AlignLeft
} from "lucide-react";
import { toast } from "sonner";

function formatDate(d: string | Date | null) {
  if (!d) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(d));
}

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return "Negotiable";
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  if (min) return `$${Number(min).toLocaleString()}`;
  return `$${Number(max!).toLocaleString()}`;
}

function parseSkills(skills: any): string[] {
  if (!skills) return [];
  try {
    const parsed = typeof skills === "string" ? JSON.parse(skills) : skills;
    return Array.isArray(parsed) ? parsed : String(skills).split(",").map((s: string) => s.trim());
  } catch {
    return String(skills).split(",").map((s: string) => s.trim());
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <span className="text-xs font-medium text-foreground text-right break-all">{value || "—"}</span>
    </div>
  );
}

export function JobApprovalManager({ initialJobs }: { initialJobs: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [jobList, setJobList]     = useState<any[]>(initialJobs);
  const [selected, setSelected]   = useState<any | null>(null);
  const [search, setSearch]       = useState("");
  const [showModInput, setShowModInput] = useState(false);
  const [modNote, setModNote]           = useState("");

  const filtered = jobList.filter((d) =>
    d.job.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const removeJob = (id: string) => {
    setJobList(prev => prev.filter(d => d.job.id !== id));
    setSelected(null);
    setShowModInput(false);
    setModNote("");
  };

  const handleApprove = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await approveJob(selected.job.id);
        toast.success("Job approved", { description: `"${selected.job.title}" is now live on the marketplace.` });
        removeJob(selected.job.id);
      } catch (err: any) {
        toast.error("Failed to approve", { description: err.message });
      }
    });
  };

  const handleDeny = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        await denyJob(selected.job.id);
        toast.success("Job denied", { description: "The buyer has been notified." });
        removeJob(selected.job.id);
      } catch (err: any) {
        toast.error("Failed to deny", { description: err.message });
      }
    });
  };

  const handleRequestMod = () => {
    if (!selected) return;
    if (!modNote.trim()) {
      toast.error("Note required", { description: "Tell the buyer what needs to be changed." });
      return;
    }
    startTransition(async () => {
      try {
        await requestJobModification(selected.job.id, modNote.trim());
        toast.success("Modification requested", { description: "The buyer has been notified with your feedback." });
        removeJob(selected.job.id);
      } catch (err: any) {
        toast.error("Failed", { description: err.message });
      }
    });
  };

  const displayName = (d: any) => d?.user?.displayName || d?.user?.name || "Buyer";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Job Approval</h2>
        <p className="text-muted-foreground mt-1">
          Review new buyer job postings before they go live on the marketplace.
        </p>
      </div>

      <div className="flex h-[calc(100vh-14rem)] rounded-xl border border-border/60 overflow-hidden bg-card shadow-sm">

        {/* ── LEFT: queue list ── */}
        <div className={`flex flex-col border-r border-border/60 bg-muted/10 transition-all duration-300
          ${selected ? "hidden lg:flex lg:w-80 xl:w-96 shrink-0" : "flex w-full"}`}
        >
          <div className="px-4 py-4 border-b border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Pending approval</h3>
              <Badge variant="secondary" className="tabular-nums">{jobList.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search title, buyer, category…"
                className="pl-8 h-8 text-xs bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
                <ShieldCheck className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">
                  {jobList.length === 0
                    ? "No pending jobs — the queue is empty!"
                    : "No results match your search."}
                </p>
              </div>
            ) : (
              filtered.map((data) => {
                const isActive = selected?.job.id === data.job.id;
                return (
                  <button
                    key={data.job.id}
                    onClick={() => { setSelected(data); setShowModInput(false); setModNote(""); }}
                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors
                      ${isActive ? "bg-primary/8 border-l-2 border-primary" : "hover:bg-muted/50 border-l-2 border-transparent"}`}
                  >
                    {/* Icon */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{data.job.title}</p>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{displayName(data)}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {data.category?.name && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {data.category.name}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(data.job.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT: detail panel ── */}
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
                  <h3 className="text-sm font-bold text-foreground line-clamp-1">{selected.job.title}</h3>
                  <p className="text-xs text-muted-foreground">{displayName(selected)} · {selected.category?.name || "Uncategorized"}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">Pending</Badge>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-5 min-h-full">

                {/* ── Meta + actions column ── */}
                <div className="xl:col-span-2 border-b xl:border-b-0 xl:border-r border-border/50 p-6 space-y-5">

                  {/* Buyer info */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Buyer</p>
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

                  {/* Job meta */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Details</p>
                    <div className="rounded-xl border border-border/60 bg-muted/10 divide-y divide-border/50">
                      <InfoRow label="Budget"      value={formatBudget(selected.job.budgetMin, selected.job.budgetMax)} />
                      <InfoRow label="Type"        value={selected.job.isFixed ? "Fixed price" : "Hourly"} />
                      <InfoRow label="Category"    value={selected.category?.name || "Uncategorized"} />
                      <InfoRow label="Skill level" value={selected.job.skillLevel || "Not specified"} />
                      <InfoRow label="Scope"       value={selected.job.projectScope || "Not specified"} />
                      <InfoRow label="Deadline"    value={selected.job.deadline ? formatDate(selected.job.deadline) : "Not specified"} />
                      <InfoRow label="Submitted"   value={formatDate(selected.job.createdAt)} />
                    </div>
                  </div>

                  {/* Decision */}
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
                          Deny Job
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">What needs to be changed?</p>
                          <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80">
                            Be specific — the buyer will see this note and needs to know exactly what to fix.
                          </p>
                        </div>
                        <Textarea
                          placeholder="e.g. Budget range is too vague. Please provide a realistic min/max. Also clarify the project scope and expected deliverables."
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

                  {/* Checklist */}
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Review checklist</p>
                    {[
                      "Title clearly describes the project",
                      "Description is detailed and professional",
                      "Budget is realistic for the scope",
                      "Skills and requirements are well defined",
                      "No prohibited content or policy violations",
                      "Category is correctly assigned",
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

                  {/* Description */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                      <AlignLeft className="h-3 w-3" /> Description
                    </p>
                    <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {selected.job.description}
                    </div>
                  </div>

                  {/* Skills */}
                  {parseSkills(selected.job.skills).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Skills & Expertise
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parseSkills(selected.job.skills).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Budget breakdown */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" /> Budget
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                        <p className="text-lg font-bold text-foreground">
                          {selected.job.budgetMin ? `$${Number(selected.job.budgetMin).toLocaleString()}` : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                        <p className="text-lg font-bold text-foreground">
                          {selected.job.budgetMax ? `$${Number(selected.job.budgetMax).toLocaleString()}` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select a job to review</p>
              <p className="text-xs text-muted-foreground mt-1">Choose a pending job from the list to approve, request changes, or deny it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
