"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertCircle, Search, Filter, Eye, Briefcase, Clock, DollarSign } from "lucide-react";
import { deleteJob } from "@/app/actions/admin-jobs";

const STATUS_COLORS: Record<string, string> = {
  open:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:   "bg-muted text-muted-foreground",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  closed:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateString));
}

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return "Negotiable";
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()}`;
  if (min) return `$${Number(min).toLocaleString()}`;
  return `$${Number(max!).toLocaleString()}`;
}

export function JobManager({ initialJobs }: { initialJobs: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [deleteData, setDeleteData] = useState<{ id: string; title: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const uniqueCategories = useMemo(() => {
    const cats = initialJobs.map((j) => j.category?.name).filter(Boolean);
    return ["All", ...Array.from(new Set(cats))];
  }, [initialJobs]);

  const filteredJobs = useMemo(() => {
    return initialJobs.filter(({ job, category }) => {
      const matchesSearch =
        job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || category?.name === selectedCategory;
      const matchesStatus =
        selectedStatus === "All" || job.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialJobs, searchQuery, selectedCategory, selectedStatus]);

  const confirmDelete = () => {
    if (!deleteData) return;
    startTransition(async () => {
      await deleteJob(deleteData.id);
      setDeleteData(null);
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Job Moderation</h2>
        <p className="text-muted-foreground mt-1">
          Review, filter, and manage all posted jobs.
        </p>
      </div>

      {/* FILTER PANEL */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 space-y-3">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job titles or descriptions..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mr-1">
              <Filter className="h-3.5 w-3.5" /> Category
            </span>
            {uniqueCategories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap transition-colors"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mr-1">
              <Briefcase className="h-3.5 w-3.5" /> Status
            </span>
            {["All", "open", "in_progress", "completed", "cancelled", "closed"].map((status) => (
              <Badge
                key={status}
                variant={selectedStatus === status ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap transition-colors capitalize"
                onClick={() => setSelectedStatus(status)}
              >
                {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* JOB GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full py-20 text-center border rounded-xl bg-background border-dashed">
            <p className="text-muted-foreground">No jobs match your current filters.</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedStatus("All");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          filteredJobs.map(({ job, category, user }) => (
            <Card
              key={job.id}
              className="flex flex-col overflow-hidden group border-border/50 hover:border-primary/30 transition-all shadow-sm"
            >
              {/* Clickable area → admin detail */}
              <Link href={`/admin/jobs/${job.id}`} className="flex flex-col flex-1 cursor-pointer">
                {/* Card header strip */}
                <div className="relative bg-muted/40 px-5 pt-5 pb-4 border-b border-border/50">
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-[11px] px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Eye className="h-3 w-3" /> Review
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}`}>
                      {job.status === "in_progress" ? "In Progress" : job.status}
                    </span>
                    {job.featured === 1 && (
                      <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {job.title}
                  </h3>

                  {category?.name && (
                    <p className="text-xs text-muted-foreground mt-1">{category.name}</p>
                  )}
                </div>

                {/* Body */}
                <CardContent className="p-5 flex-1 flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Meta row */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {formatBudget(job.budgetMin, job.budgetMax)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>{job.bidCount ?? 0} bids</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    {user?.name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                        <span className="h-4 w-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {(user.displayName || user.name).charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{user.displayName || user.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Link>

              {/* Admin footer */}
              <div className="bg-destructive/5 border-t p-3 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setDeleteData({ id: job.id, title: job.title })}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Job
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm shadow-lg border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-lg">Delete this Job?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-6">
                This will permanently remove <strong>{deleteData.title}</strong> and all associated bids from the platform.
              </p>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button variant="ghost" onClick={() => setDeleteData(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Deleting..." : "Delete Job"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
