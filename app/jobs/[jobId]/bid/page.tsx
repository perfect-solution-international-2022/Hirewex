import { db } from "@/lib/db";
import { jobs, categories, users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { BidForm } from "./BidForm";

export default async function BidPage({ params }: { params: { jobId: string } }) {
  const resolvedParams = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/auth?mode=signin");

  const [data] = await db
    .select({ job: jobs, category: categories, user: users })
    .from(jobs)
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(jobs.buyerId, users.id))
    .where(eq(jobs.id, resolvedParams.jobId))
    .limit(1);

  if (!data) notFound();

  // Prevent buyer from bidding on their own job
  if (data.job.buyerId === session.user.id) redirect(`/jobs/${resolvedParams.jobId}`);

  return (
    <div className="flex min-h-screen flex-col bg-muted/10">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-12 max-w-3xl">
        <BidForm job={data.job} buyer={data.user} category={data.category} />
      </main>
      <SiteFooter />
    </div>
  );
}
