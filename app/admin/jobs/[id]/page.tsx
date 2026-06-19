import { db } from "@/lib/db";
import { jobs, categories, users, bids, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  Briefcase,
  MapPin,
  DollarSign,
  Eye,
  Users,
  Star,
} from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  open:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:   "bg-muted text-muted-foreground",
  cancelled:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  closed:      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const BID_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  accepted:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  withdrawn: "bg-muted text-muted-foreground",
};

function formatDate(dateString: string | Date | null) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateString));
}

function formatBudget(min: string | null, max: string | null) {
  if (!min && !max) return "Negotiable";
  if (min && max) return `$${Number(min).toLocaleString()} – $${Number(max).toLocaleString()} USD`;
  if (min) return `$${Number(min).toLocaleString()} USD`;
  return `$${Number(max!).toLocaleString()} USD`;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const [data] = await db
    .select({ job: jobs })
    .from(jobs)
    .where(eq(jobs.id, resolvedParams.id));
  return {
    title: data ? `${data.job.title} — Admin Review` : "Job — Admin",
  };
}

export default async function AdminJobDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  // Fetch job + category + buyer
  const [data] = await db
    .select({ job: jobs, category: categories, user: users })
    .from(jobs)
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .where(eq(jobs.id, jobId));

  if (!data) notFound();

  const { job, category, user } = data;

  // Fetch bids with freelancer info
  const jobBids = await db
    .select({ bid: bids, freelancer: users, profile: profiles })
    .from(bids)
    .leftJoin(users, eq(bids.freelancerId, users.id))
    .leftJoin(profiles, eq(bids.freelancerId, profiles.id))
    .where(eq(bids.jobId, jobId))
    .orderBy(desc(bids.createdAt));

  // Parse skills
  let skillsArray: string[] = [];
  if (typeof job.skills === "string") {
    try {
      const parsed = JSON.parse(job.skills);
      skillsArray = Array.isArray(parsed) ? parsed : job.skills.split(",").map((s: string) => s.trim());
    } catch {
      skillsArray = job.skills.split(",").map((s: string) => s.trim());
    }
  } else if (Array.isArray(job.skills)) {
    skillsArray = job.skills as string[];
  }

  const posterName = user?.displayName || user?.name || "Anonymous Client";
  const posterPic = user?.avatarUrl || user?.image || null;

  return (
    <DashboardShell title="Job Review" role="admin">
      <div className="mx-auto w-full max-w-4xl space-y-8 pb-16">

        {/* Back + status */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}`}>
            {job.status === "in_progress" ? "In Progress" : job.status}
          </span>
        </div>

        {/* Title + budget */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-foreground">
              {job.title}
              {job.featured === 1 && (
                <span className="ml-3 inline-flex align-middle items-center bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[11px] px-2.5 py-1 rounded-sm uppercase tracking-wide font-bold">
                  Featured
                </span>
              )}
            </h1>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {formatBudget(job.budgetMin, job.budgetMax)}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {job.isFixed ? "Fixed price" : "Hourly"}
              </div>
            </div>
          </div>

          {/* Poster row */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 border border-border/50">
              {posterPic ? (
                <img src={posterPic} alt={posterName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">{posterName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{posterName}</p>
              <p className="text-xs text-muted-foreground">Posted {formatDate(job.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">Project Description</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {job.description}
          </div>
        </section>

        {/* Job meta */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">About the job</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[
              { icon: Clock,        label: "Posted",          value: formatDate(job.createdAt) },
              { icon: Calendar,     label: "Deadline",        value: job.deadline ? formatDate(job.deadline) : "Not specified" },
              { icon: Briefcase,    label: "Experience level",value: job.skillLevel || "Not specified" },
              { icon: CheckCircle2, label: "Project scope",   value: job.projectScope || "Not specified" },
              { icon: MapPin,       label: "Location",        value: "100% Remote" },
              { icon: Eye,          label: "Views",           value: String(job.views ?? 0) },
              { icon: Users,        label: "Bids",            value: String(job.bidCount ?? 0) },
              { icon: DollarSign,   label: "Budget type",     value: job.isFixed ? "Fixed price" : "Hourly rate" },
              ...(category?.name ? [{ icon: Briefcase, label: "Category", value: category.name }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        {skillsArray.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(skillsArray.filter(Boolean))).map((skill, i) => (
                <Badge key={i} variant="secondary" className="rounded-full px-4 py-1.5 font-medium">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Bids */}
        <section>
          <h2 className="text-lg font-bold mb-4 pb-3 border-b border-border/50 flex items-center gap-2">
            Bids
            <span className="text-sm font-normal text-muted-foreground">({jobBids.length})</span>
          </h2>

          {jobBids.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 py-10 text-center">
              <p className="text-sm text-muted-foreground">No bids placed yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50">
              {jobBids.map(({ bid, freelancer, profile }) => {
                const name = freelancer?.displayName || freelancer?.name || "Freelancer";
                const avatar = profile?.avatarUrl || freelancer?.avatarUrl || freelancer?.image || null;
                const rating = profile?.rating ? Number(profile.rating).toFixed(1) : null;
                const jobsDone = profile?.jobsCompleted ?? 0;

                return (
                  <div key={bid.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={avatar || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{name}</span>
                        {rating && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">· {jobsDone} jobs completed</span>
                      </div>

                      {bid.coverLetter && (
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {bid.coverLetter}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-1">{formatDate(bid.createdAt)}</p>
                    </div>

                    <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                      <span className="text-base font-bold text-foreground">
                        ${Number(bid.amount).toLocaleString()}
                      </span>
                      {bid.deliveryDays && (
                        <span className="text-xs text-muted-foreground">{bid.deliveryDays} days</span>
                      )}
                      <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${BID_STATUS_COLORS[bid.status] || "bg-muted text-muted-foreground"}`}>
                        {bid.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </DashboardShell>
  );
}
