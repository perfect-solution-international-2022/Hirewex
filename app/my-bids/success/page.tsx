import { db } from "@/lib/db";
import { bids, jobs, notifications } from "@/drizzle/schema";
import { eq, and, ne } from "drizzle-orm";
import Link from "next/link";
import Pusher from "pusher";
import { getUserEmail, emailFreelancerBidAccepted } from "@/lib/email";

const pusher = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS:  true,
});

export const dynamic = "force-dynamic";

export default async function BidPaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params      = await searchParams;
  const bidId       = params.bidId;
  const jobId       = params.jobId;
  const freelancerId = params.freelancerId;

  if (!bidId || !jobId || !freelancerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="p-8 bg-white rounded-2xl shadow-xl max-w-lg w-full border border-red-100 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Missing Parameters</h1>
          <p className="text-gray-600 text-sm">Could not process this payment confirmation.</p>
          <Link href="/my-bids" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to My Bids
          </Link>
        </div>
      </div>
    );
  }

  // Fetch the bid to check it hasn't already been processed
  const [bid] = await db
    .select()
    .from(bids)
    .where(eq(bids.id, bidId))
    .limit(1);

  if (!bid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Bid not found</h1>
        <Link href="/my-bids" className="text-blue-600 hover:underline mt-4">Return to My Bids</Link>
      </div>
    );
  }

  // Only process once — if already accepted, just show success
  if (bid.status !== "accepted") {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 1. Accept this bid
    await db
      .update(bids)
      .set({ status: "accepted" })
      .where(eq(bids.id, bidId));

    // 2. Reject all other bids on this job with rejectedAt timestamp
    //    so freelancers see "rejected" for 24h then they disappear
    await db
      .update(bids)
      .set({ status: "rejected", rejectedAt: now })
      .where(and(eq(bids.jobId, jobId), ne(bids.id, bidId)));

    // 3. Set job to in_progress so it disappears from public listing
    await db
      .update(jobs)
      .set({ status: "in_progress" })
      .where(eq(jobs.id, jobId));

    // 4. Fetch job title for notification
    const [job] = await db
      .select({ title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, jobId));

    const jobTitle = job?.title || "a project";

    // 5. Notify the hired freelancer
    const notificationId = crypto.randomUUID();
    try {
      await db.insert(notifications).values({
        id:     notificationId,
        userId: freelancerId,
        title:  "You got hired! 🎉",
        body:   `Your bid on "${jobTitle}" was accepted. The buyer has paid — check your hired jobs.`,
        link:   "/freelancer/hired",
        read:   0,
      });

      await pusher.trigger(`user-${freelancerId}`, "notification", {
        id:    notificationId,
        title: "You got hired! 🎉",
        body:  `Your bid on "${jobTitle}" was accepted. The buyer has paid — check your hired jobs.`,
        link:  "/freelancer/hired",
      });
    } catch (err) {
      console.warn("Pusher notification failed (non-fatal):", err);
    }

    // Email the hired freelancer
    const freelancer = await getUserEmail(freelancerId);
    if (freelancer) {
      await emailFreelancerBidAccepted(
        freelancer.email, freelancer.name,
        jobTitle,
        bid.amount,
        bid.deliveryDays ?? 7,
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden text-center border border-gray-100">

        {/* Top banner */}
        <div className="bg-green-500 pt-10 pb-12 relative flex justify-center">
          <div className="bg-white rounded-full p-4 shadow-lg transform translate-y-8 relative z-10">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="px-8 pt-12 pb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Hire Confirmed!</h1>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Your payment has been processed and held in escrow. The freelancer has been notified and your project is now in progress.
          </p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100 shadow-inner space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm font-medium">Status</span>
              <span className="inline-flex items-center text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></span>
                In Progress
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm font-medium">Payment</span>
              <span className="text-gray-700 text-sm font-semibold">Held in escrow</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href="/my-bids"
              className="w-full flex justify-center items-center bg-gray-900 text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-md"
            >
              View Hired Freelancers
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="w-full flex justify-center items-center bg-white text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all duration-200"
            >
              Return Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
