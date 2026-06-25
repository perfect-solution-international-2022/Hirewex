import { db } from "@/lib/db";
import { jobs, categories, users } from "@/drizzle/schema"; 
import { eq, desc, and } from "drizzle-orm";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader"; // Assuming this path
import { JobsClient } from "./JobsClient";

export const metadata = {
  title: "Find Freelance Jobs & Remote Work — Browse Open Projects",
  description:
    "Find freelance jobs and remote projects across web development, design, marketing, writing and more. Place your bid and start earning on Hirewex.",
  keywords: [
    "freelance jobs", "remote work", "find freelance projects",
    "web developer jobs", "designer jobs", "remote freelancing",
    "bid on projects", "online jobs",
  ],
  openGraph: {
    title: "Find Freelance Jobs — Hirewex",
    description: "Browse open freelance projects and remote jobs. Place your bid and start earning.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function FreelancerJobsPage() {
  const liveJobs = await db
    .select({
      job: jobs,
      category: categories,
      user: users,
    })
    .from(jobs)
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .where(and(
      eq(jobs.status, "open"),
      eq(jobs.approvalStatus, "approved")
    ))
    .orderBy(desc(jobs.createdAt));

  return (
    // Use the public layout instead of the private DashboardShell
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Find your next job</h1>
          <p className="text-muted-foreground mt-1">Browse and bid on open projects tailored to your skills.</p>
        </div>
        <JobsClient initialJobs={liveJobs} />
      </main>

      <SiteFooter />
    </div>
  );
}