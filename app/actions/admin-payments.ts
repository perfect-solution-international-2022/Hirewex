"use server";

import { db } from "@/lib/db";
import {
  projectSubmissions, projects, jobs, serviceOrders, freelancerServices,
  transactions, profiles, notifications, userRoles,
} from "@/drizzle/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { getUserEmail, emailFreelancerPaymentReleased } from "@/lib/email";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function releasePaymentAction(
  submissionId: string,
  serviceFeePercent: number,
  commissionPercent: number
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [roleRow] = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, session.user.id), eq(userRoles.role, "admin")))
      .limit(1);
    if (!roleRow) return { success: false, error: "Unauthorized" };

    const [submission] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId))
      .limit(1);

    if (!submission) return { success: false, error: "Submission not found." };
    if (submission.status !== "accepted") return { success: false, error: "Work has not been accepted by the buyer yet." };
    if (submission.paymentReleasedAt) return { success: false, error: "Payment has already been released." };

    // Determine gross amount and context
    let grossAmount = 0;
    let contextTitle = "project";
    let relatedProjectId: string | null = null;

    if (submission.type === "project" && submission.projectId) {
      const [proj] = await db
        .select({ amount: projects.amount, jobId: projects.jobId })
        .from(projects)
        .where(eq(projects.id, submission.projectId))
        .limit(1);
      if (!proj) return { success: false, error: "Project not found." };
      grossAmount = Number(proj.amount);
      relatedProjectId = submission.projectId;
      const [jobRow] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, proj.jobId)).limit(1);
      contextTitle = jobRow?.title ?? "project";
    } else if (submission.type === "order" && submission.serviceOrderId) {
      const [order] = await db
        .select({ price: serviceOrders.price, serviceId: serviceOrders.serviceId })
        .from(serviceOrders)
        .where(eq(serviceOrders.id, submission.serviceOrderId))
        .limit(1);
      if (!order) return { success: false, error: "Order not found." };
      grossAmount = Number(order.price);
      const [svc] = await db
        .select({ title: freelancerServices.title })
        .from(freelancerServices)
        .where(eq(freelancerServices.id, order.serviceId))
        .limit(1);
      contextTitle = svc?.title ?? "service order";
    } else {
      return { success: false, error: "Invalid submission." };
    }

    const totalFeePercent = serviceFeePercent + commissionPercent;
    const feeAmount = +(grossAmount * (totalFeePercent / 100)).toFixed(2);
    const netAmount = +(grossAmount - feeAmount).toFixed(2);

    if (netAmount <= 0) return { success: false, error: "Net amount after fees must be positive." };

    // Transaction: release to freelancer
    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId: submission.freelancerId,
      amount: String(netAmount),
      type: "release",
      status: "completed",
      description: `Payment released for "${contextTitle}" (${totalFeePercent}% platform fee)`,
      reference: `sub:${submissionId}`,
      relatedProjectId,
    });

    // Transaction: fee record
    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId: submission.buyerId,
      amount: String(feeAmount),
      type: "fee",
      status: "completed",
      description: `Platform fee for "${contextTitle}" (${serviceFeePercent}% service + ${commissionPercent}% commission)`,
      reference: `sub:${submissionId}`,
      relatedProjectId,
    });

    // Credit freelancer balance
    await db
      .update(profiles)
      .set({ balance: sql`balance + ${netAmount}` })
      .where(eq(profiles.id, submission.freelancerId));

    // Mark submission as released
    await db
      .update(projectSubmissions)
      .set({
        paymentReleasedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        releasedAmount: String(netAmount),
        platformFeePercent: String(totalFeePercent),
      })
      .where(eq(projectSubmissions.id, submissionId));

    // Notify freelancer
    const notifId = crypto.randomUUID();
    const notifPayload = {
      id: notifId,
      title: "Payment released!",
      body: `$${netAmount.toFixed(2)} has been added to your balance for "${contextTitle}".`,
      link: "/freelancer/transactions",
    };
    await db.insert(notifications).values({ ...notifPayload, userId: submission.freelancerId, read: 0 });
    try {
      await pusher.trigger(`user-${submission.freelancerId}`, "notification", notifPayload);
    } catch (err) {
      console.warn("Pusher failed (non-fatal):", err);
    }

    // Email the freelancer
    const freelancer = await getUserEmail(submission.freelancerId);
    if (freelancer) {
      await emailFreelancerPaymentReleased(freelancer.email, freelancer.name, contextTitle, netAmount);
    }

    revalidatePath("/admin/payments");
    return { success: true, netAmount };
  } catch (error) {
    console.error("releasePaymentAction error:", error);
    return { success: false, error: "Failed to release payment. Please try again." };
  }
}
