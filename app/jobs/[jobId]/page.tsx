import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { jobs, categories, users, bids, profiles } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createOrGetConversation } from "@/app/actions/chat";
import {
  CheckCircle2, Clock, Calendar, Briefcase,
  Globe, MapPin, ChevronRight, User, Zap,
  DollarSign, Star, FileText
} from "lucide-react";

function formatDate(dateString: string | Date | null) {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
}

export default async function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;

  const jobResult = await db
    .select({ job: jobs, category: categories, user: users, buyerId: jobs.buyerId })
    .from(jobs)
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!jobResult || jobResult.length === 0) notFound();

  const { job, category, user } = jobResult[0];
  const isOwner = currentUserId === job.buyerId;

  // Fetch real bids
  const jobBids = await db
    .select({ bid: bids, freelancer: users, profile: profiles })
    .from(bids)
    .leftJoin(users, eq(bids.freelancerId, users.id))
    .leftJoin(profiles, eq(bids.freelancerId, profiles.id))
    .where(eq(bids.jobId, jobId))
    .orderBy(desc(bids.createdAt));

  const posterName = user?.displayName || user?.name || "Anonymous Client";
  const posterPic  = user?.avatarUrl || user?.image || null;

  let skillsArray: string[] = [];
  if (typeof job.skills === 'string') {
    try {
      const parsed = JSON.parse(job.skills);
      skillsArray = Array.isArray(parsed) ? parsed : job.skills.split(',').map((s: string) => s.trim());
    } catch {
      skillsArray = job.skills.split(',').map((s: string) => s.trim());
    }
  } else if (Array.isArray(job.skills)) {
    skillsArray = job.skills;
  }

  const budgetDisplay = job.budgetMin && job.budgetMax 
    ? `$${Number(job.budgetMin).toLocaleString()} - $${Number(job.budgetMax).toLocaleString()} USD`
    : job.budgetMin ? `$${Number(job.budgetMin).toLocaleString()} USD` : "Negotiable";

  const deadlineDisplay = job.deadline ? formatDate(job.deadline) : "Not Specified";

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />

      <main className="container mx-auto px-4 py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border/50 rounded-xl p-6 sm:p-8 shadow-sm">
              
              {/* Poster */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/40">
                <div className="h-12 w-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0 border border-border/50">
                  {posterPic ? (
                    <img src={posterPic} alt={posterName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{posterName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <p className="text-base font-bold text-foreground capitalize">{posterName}</p>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">{job.title}</h1>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-500">{budgetDisplay}</div>
                  <div className="text-sm text-muted-foreground mt-1">Bids: {job.bidCount || 0}</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-8">
                Posted {formatDate(job.createdAt)} • Deadline: {deadlineDisplay}
              </p>

              <div className="space-y-4 mb-10">
                <h3 className="font-semibold text-lg text-foreground">Project Description:</h3>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>

              <hr className="border-border/50 mb-8" />

              <h3 className="font-bold text-xl text-foreground mb-6">About the job</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4 mb-10">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><Clock className="h-4 w-4" /><span className="text-sm">Posted</span></div>
                  <p className="font-semibold text-sm">{formatDate(job.createdAt)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="h-4 w-4" /><span className="text-sm">Deadline</span></div>
                  <p className="font-semibold text-sm">{deadlineDisplay}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><Briefcase className="h-4 w-4" /><span className="text-sm">Experience level</span></div>
                  <p className="font-semibold text-sm">{job.skillLevel || "Not Specified"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><CheckCircle2 className="h-4 w-4" /><span className="text-sm">Project Scope</span></div>
                  <p className="font-semibold text-sm">{job.projectScope || "Not Specified"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1"><MapPin className="h-4 w-4" /><span className="text-sm">Location</span></div>
                  <p className="font-semibold text-sm">100% Remote</p>
                </div>
              </div>

              <hr className="border-border/50 mb-8" />

              <h3 className="font-bold text-xl text-foreground mb-6">Skills & expertise</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(skillsArray.filter(Boolean))).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-4 py-1.5 font-medium">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* REAL BIDS LIST */}
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {jobBids.length} {jobBids.length === 1 ? "Freelancer is" : "Freelancers are"} bidding
              </h2>

              {jobBids.length === 0 ? (
                <div className="bg-card border border-dashed border-border/60 rounded-xl p-10 text-center">
                  <p className="text-muted-foreground text-sm">No bids yet — be the first to submit a proposal!</p>
                </div>
              ) : (
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm divide-y divide-border/50">
                  {jobBids.map(({ bid, freelancer, profile }) => {
                    const name   = freelancer?.displayName || freelancer?.name || "Freelancer";
                    const avatar = profile?.avatarUrl || freelancer?.avatarUrl || freelancer?.image || "";
                    const rating = profile?.rating ? Number(profile.rating).toFixed(1) : null;
                    const jobsDone = profile?.jobsCompleted ?? 0;
                    const country  = profile?.country || freelancer?.location || "Unknown";

                    return (
                      <div key={bid.id} className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage src={avatar} />
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-bold text-lg">{name}</h4>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {country}
                                </span>
                                {rating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" /> {jobsDone} jobs done
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-foreground">
                                  <DollarSign className="h-3 w-3" /> ${Number(bid.amount).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> {bid.deliveryDays}d delivery
                                </span>
                              </div>
                              {bid.coverLetter && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-lg leading-relaxed">
                                  {bid.coverLetter}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/profile-preview/${freelancer?.id}`}>View Profile</Link>
                            </Button>
                            {bid.portfolioUrl && (
                              <a
                                href={bid.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" /> View Portfolio
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-1 sticky top-8">
            <div className="bg-[#111827] text-white rounded-xl p-6 shadow-xl border border-white/10">
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {job.budgetMin ? `$${Number(job.budgetMin).toLocaleString()}` : "Open"}
              </h2>
              <p className="text-slate-300 text-sm mb-6">{job.title}</p>
              
              <div className="space-y-3">
                {isOwner ? (
                  <div className="text-center text-sm text-slate-400 py-2 border border-white/10 rounded-lg">
                    This is your job posting
                  </div>
                ) : (
                  <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12">
                    <Link href={`/jobs/${jobId}/bid`}>
                      Submit Proposal & Bid <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}

                {!isOwner && job.buyerId && (
                  <form action={createOrGetConversation.bind(null, job.buyerId, "buyer", job.id, "job")}>
                    <Button 
                      type="submit"
                      variant="outline"
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white h-12 font-semibold"
                    >
                      Message buyer
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
