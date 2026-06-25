"use server";

import { db } from "@/lib/db";
import { bids, jobs, notifications, projects } from "@/drizzle/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { put } from "@vercel/blob";
import Pusher from "pusher";
import { getUserEmail, emailBuyerNewBid, emailFreelancerBidAccepted } from "@/lib/email";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function submitBidAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const jobId        = formData.get("jobId") as string;
    const amount       = formData.get("amount") as string;
    const deliveryDays = formData.get("deliveryDays") as string;
    const coverLetter  = formData.get("coverLetter") as string;
    const portfolioFile = formData.get("portfolio") as File | null;

    if (!jobId || !amount || !deliveryDays) {
      return { success: false, error: "Missing required fields." };
    }

    const existing = await db
      .select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.jobId, jobId), eq(bids.freelancerId, session.user.id)))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "You have already submitted a bid on this job." };
    }

    let portfolioUrl: string | null = null;
    if (portfolioFile && portfolioFile.size > 0) {
      const blob = await put(
        `portfolios/${session.user.id}/${crypto.randomUUID()}-${portfolioFile.name}`,
        portfolioFile,
        { access: "public" }
      );
      portfolioUrl = blob.url;
    }

    await db.insert(bids).values({
      id: crypto.randomUUID(),
      jobId,
      freelancerId: session.user.id,
      amount,
      deliveryDays: parseInt(deliveryDays),
      coverLetter: coverLetter || null,
      portfolioUrl,
      status: "pending",
    });

    const [jobRow] = await db
      .select({ bidCount: jobs.bidCount, buyerId: jobs.buyerId, title: jobs.title })
      .from(jobs).where(eq(jobs.id, jobId));

    await db.update(jobs)
      .set({ bidCount: (jobRow?.bidCount ?? 0) + 1 })
      .where(eq(jobs.id, jobId));

    if (jobRow?.buyerId) {
      const notificationId = crypto.randomUUID();
      await db.insert(notifications).values({
        id: notificationId,
        userId: jobRow.buyerId,
        title: "New bid received",
        body: `You received a new proposal on "${jobRow.title}".`,
        link: "/my-bids",
        read: 0,
      });
      try {
        await pusher.trigger(`user-${jobRow.buyerId}`, "notification", {
          id: notificationId,
          title: "New bid received",
          body: `You received a new proposal on "${jobRow.title}".`,
          link: "/my-bids",
        });
      } catch (err) {
        console.warn("Pusher trigger failed (non-fatal):", err);
      }

      // Email the buyer about the new bid
      const buyer = await getUserEmail(jobRow.buyerId);
      if (buyer) {
        await emailBuyerNewBid(
          buyer.email, buyer.name,
          jobRow.title,
          session.user.name || "A freelancer",
          amount,
          parseInt(deliveryDays),
        );
      }
    }

    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/my-bids");
    return { success: true, portfolioUrl };
  } catch (error) {
    console.error("submitBidAction error:", error);
    return { success: false, error: "Failed to submit bid. Please try again." };
  }
}

export async function hireBidAction(bidId: string, jobId: string, freelancerId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [jobRow] = await db
      .select({ title: jobs.title, buyerId: jobs.buyerId })
      .from(jobs).where(eq(jobs.id, jobId));
    if (!jobRow || jobRow.buyerId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const [bidRow] = await db
      .select({ amount: bids.amount, deliveryDays: bids.deliveryDays })
      .from(bids).where(eq(bids.id, bidId)).limit(1);

    await db.update(bids).set({ status: "accepted" }).where(eq(bids.id, bidId));

    await db.insert(projects).values({
      id: crypto.randomUUID(),
      jobId,
      bidId,
      buyerId: session.user.id,
      freelancerId,
      amount: bidRow?.amount ?? "0",
      status: "active",
    });

    await db.update(bids)
      .set({ status: "rejected" })
      .where(and(eq(bids.jobId, jobId), eq(bids.status, "pending")));

    await db.update(jobs).set({ status: "in_progress" }).where(eq(jobs.id, jobId));

    if (freelancerId) {
      const notificationId = crypto.randomUUID();
      await db.insert(notifications).values({
        id: notificationId,
        userId: freelancerId,
        title: "You got hired! 🎉",
        body: `You've been hired for "${jobRow.title}". Check the project details to get started.`,
        link: "/freelancer/hired",
        read: 0,
      });
      try {
        await pusher.trigger(`user-${freelancerId}`, "notification", {
          id: notificationId,
          title: "You got hired! 🎉",
          body: `You've been hired for "${jobRow.title}". Check the project details to get started.`,
          link: "/freelancer/hired",
        });
      } catch (err) {
        console.warn("Pusher trigger failed (non-fatal):", err);
      }

      // Email the freelancer
      const freelancer = await getUserEmail(freelancerId);
      if (freelancer) {
        await emailFreelancerBidAccepted(
          freelancer.email, freelancer.name,
          jobRow.title,
          bidRow?.amount ?? "0",
          bidRow?.deliveryDays ?? 7,
        );
      }
    }

    revalidatePath("/my-bids");
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath("/freelancer/hired");
    return { success: true };
  } catch (error) {
    console.error("hireBidAction error:", error);
    return { success: false, error: "Failed to hire freelancer." };
  }
}
