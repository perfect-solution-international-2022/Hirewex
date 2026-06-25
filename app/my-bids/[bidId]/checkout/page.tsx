import { db } from "@/lib/db";
import { bids, jobs, users, profiles, categories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader, SiteFooter } from "@/components/layout/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CheckoutClient } from "./CheckoutClient";
import { getServiceFeePercent } from "@/app/actions/platform-settings";

export const dynamic = "force-dynamic";

export default async function BidCheckoutPage({ params }: { params: { bidId: string } }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?mode=signin");

  const [data] = await db
    .select({
      bid: bids,
      job: jobs,
      category: categories,
      freelancer: users,
      profile: profiles,
    })
    .from(bids)
    .innerJoin(jobs, eq(bids.jobId, jobs.id))
    .leftJoin(categories, eq(jobs.categoryId, categories.id))
    .leftJoin(users, eq(bids.freelancerId, users.id))
    .leftJoin(profiles, eq(bids.freelancerId, profiles.id))
    .where(eq(bids.id, resolvedParams.bidId))
    .limit(1);

  if (!data) notFound();

  // Security: only the buyer who owns this job can view checkout
  if (data.job.buyerId !== session.user.id) redirect("/my-bids");

  const serviceFeePercent = await getServiceFeePercent();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-muted/10">
        <SiteHeader />
        <main className="container mx-auto flex-1 px-4 py-12 max-w-4xl">
          <CheckoutClient data={data} serviceFeePercent={serviceFeePercent} />
        </main>
        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}
