"use server";

import { db } from "@/lib/db";
import { bids, jobs, projects, projectSubmissions, notifications, serviceOrders, freelancerServices, refundRequests } from "@/drizzle/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import Pusher from "pusher";
import { getServiceFeePercent } from "@/app/actions/platform-settings";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

async function triggerNotification(userId: string, payload: { id: string; title: string; body: string; link: string }) {
  await db.insert(notifications).values({ ...payload, userId, read: 0 });
  try {
    await pusher.trigger(`user-${userId}`, "notification", payload);
  } catch (err) {
    console.warn("Pusher trigger failed (non-fatal):", err);
  }
}

async function uploadFile(file: File, userId: string): Promise<string> {
  const blob = await put(
    `submissions/${userId}/${crypto.randomUUID()}-${file.name}`,
    file,
    { access: "public" }
  );
  return blob.url;
}

// ─── Job bid submission ───────────────────────────────────────────────────────

export async function submitWorkAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const bidId = formData.get("bidId") as string;
    const jobId = formData.get("jobId") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!bidId || !jobId) return { success: false, error: "Missing required fields." };
    if (!description && !linkUrl && (!file || file.size === 0)) {
      return { success: false, error: "Please provide a description, link, or file." };
    }

    const [bid] = await db
      .select({ freelancerId: bids.freelancerId, amount: bids.amount, status: bids.status })
      .from(bids).where(eq(bids.id, bidId)).limit(1);

    if (!bid || bid.freelancerId !== session.user.id || bid.status !== "accepted") {
      return { success: false, error: "Unauthorized" };
    }

    let [project] = await db.select().from(projects).where(eq(projects.bidId, bidId)).limit(1);

    if (!project) {
      const [jobRow] = await db.select({ buyerId: jobs.buyerId }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!jobRow) return { success: false, error: "Job not found." };
      const projectId = crypto.randomUUID();
      await db.insert(projects).values({
        id: projectId, jobId, bidId,
        buyerId: jobRow.buyerId,
        freelancerId: session.user.id,
        amount: bid.amount,
        status: "active",
      });
      [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    }

    if (project.freelancerId !== session.user.id) return { success: false, error: "Unauthorized" };

    const fileUrl = file && file.size > 0 ? await uploadFile(file, session.user.id) : null;

    await db.insert(projectSubmissions).values({
      id: crypto.randomUUID(),
      type: "project",
      projectId: project.id,
      serviceOrderId: null,
      freelancerId: session.user.id,
      buyerId: project.buyerId,
      description, fileUrl, linkUrl,
      status: "pending",
    });

    await db.update(projects).set({ status: "submitted" }).where(eq(projects.id, project.id));

    const [jobRow] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const notifId = crypto.randomUUID();
    await triggerNotification(project.buyerId, {
      id: notifId,
      title: "Work submitted for review",
      body: `A freelancer submitted work for "${jobRow?.title ?? "your project"}". Review it now.`,
      link: "/submitted-work",
    });

    revalidatePath("/freelancer/hired");
    revalidatePath("/submitted-work");
    return { success: true };
  } catch (error) {
    console.error("submitWorkAction error:", error);
    return { success: false, error: "Failed to submit work. Please try again." };
  }
}

// ─── Service order submission ─────────────────────────────────────────────────

export async function submitOrderWorkAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const orderId = formData.get("orderId") as string;
    const description = (formData.get("description") as string)?.trim() || null;
    const linkUrl = (formData.get("linkUrl") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!orderId) return { success: false, error: "Missing order ID." };
    if (!description && !linkUrl && (!file || file.size === 0)) {
      return { success: false, error: "Please provide a description, link, or file." };
    }

    const [order] = await db
      .select({
        id: serviceOrders.id,
        freelancerId: serviceOrders.freelancerId,
        buyerId: serviceOrders.buyerId,
        status: serviceOrders.status,
        serviceId: serviceOrders.serviceId,
      })
      .from(serviceOrders).where(eq(serviceOrders.id, orderId)).limit(1);

    if (!order || order.freelancerId !== session.user.id) return { success: false, error: "Unauthorized" };
    if (order.status !== "paid") return { success: false, error: "This order is not active." };

    const fileUrl = file && file.size > 0 ? await uploadFile(file, session.user.id) : null;

    await db.insert(projectSubmissions).values({
      id: crypto.randomUUID(),
      type: "order",
      projectId: null,
      serviceOrderId: orderId,
      freelancerId: session.user.id,
      buyerId: order.buyerId,
      description, fileUrl, linkUrl,
      status: "pending",
    });

    const [svc] = await db.select({ title: freelancerServices.title }).from(freelancerServices).where(eq(freelancerServices.id, order.serviceId)).limit(1);
    const notifId = crypto.randomUUID();
    await triggerNotification(order.buyerId, {
      id: notifId,
      title: "Order delivery submitted",
      body: `A freelancer has delivered your order "${svc?.title ?? "service"}". Review it now.`,
      link: "/submitted-work",
    });

    revalidatePath(`/freelancer/orders/${orderId}`);
    revalidatePath("/submitted-work");
    return { success: true };
  } catch (error) {
    console.error("submitOrderWorkAction error:", error);
    return { success: false, error: "Failed to submit delivery. Please try again." };
  }
}

// ─── Buyer review (works for both types) ─────────────────────────────────────

export async function reviewSubmissionAction(
  submissionId: string,
  action: "accepted" | "rejected" | "revision_requested",
  buyerNote?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const [submission] = await db
      .select().from(projectSubmissions).where(eq(projectSubmissions.id, submissionId)).limit(1);

    if (!submission || submission.buyerId !== session.user.id) return { success: false, error: "Unauthorized" };

    await db
      .update(projectSubmissions)
      .set({ status: action, buyerNote: buyerNote?.trim() || null })
      .where(eq(projectSubmissions.id, submissionId));

    // Update project status for job submissions
    if (submission.type === "project" && submission.projectId) {
      if (action === "accepted") {
        await db.update(projects)
          .set({ status: "completed", completedAt: new Date().toISOString().slice(0, 19).replace("T", " ") })
          .where(eq(projects.id, submission.projectId));
      } else if (action === "rejected") {
        await db.update(projects).set({ status: "disputed" }).where(eq(projects.id, submission.projectId));
      } else {
        // revision_requested → back to active so freelancer can resubmit
        await db.update(projects).set({ status: "active" }).where(eq(projects.id, submission.projectId));
      }
    }

    // When buyer rejects → create a refund request for admin to review
    if (action === "rejected") {
      const feeRate = (await getServiceFeePercent()) / 100;
      let refundAmount = 0;

      if (submission.type === "project" && submission.projectId) {
        const [proj] = await db.select({ amount: projects.amount }).from(projects).where(eq(projects.id, submission.projectId)).limit(1);
        refundAmount = Number(proj?.amount ?? 0);
      } else if (submission.type === "order" && submission.serviceOrderId) {
        const [ord] = await db.select({ price: serviceOrders.price }).from(serviceOrders).where(eq(serviceOrders.id, submission.serviceOrderId)).limit(1);
        refundAmount = Number(ord?.price ?? 0);
      }

      const serviceFeeRetained = +(refundAmount * feeRate).toFixed(2);
      const reason = buyerNote?.trim()
        ? `Buyer rejected the submitted work. Reason: ${buyerNote.trim()}`
        : "Buyer rejected the submitted work without providing a reason.";

      await db.insert(refundRequests).values({
        id: crypto.randomUUID(),
        type: "buyer_rejection",
        projectId: submission.projectId ?? null,
        serviceOrderId: submission.serviceOrderId ?? null,
        buyerId: submission.buyerId,
        freelancerId: submission.freelancerId,
        reason,
        refundAmount: refundAmount.toFixed(2),
        serviceFeeRetained: serviceFeeRetained.toFixed(2),
        status: "pending",
      });
    }

    // Build notification for freelancer
    let contextTitle = "the project";
    if (submission.type === "project" && submission.projectId) {
      const [proj] = await db.select({ jobId: projects.jobId }).from(projects).where(eq(projects.id, submission.projectId)).limit(1);
      if (proj) {
        const [jobRow] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, proj.jobId)).limit(1);
        if (jobRow) contextTitle = jobRow.title;
      }
    } else if (submission.type === "order" && submission.serviceOrderId) {
      const [ord] = await db.select({ serviceId: serviceOrders.serviceId }).from(serviceOrders).where(eq(serviceOrders.id, submission.serviceOrderId)).limit(1);
      if (ord) {
        const [svc] = await db.select({ title: freelancerServices.title }).from(freelancerServices).where(eq(freelancerServices.id, ord.serviceId)).limit(1);
        if (svc) contextTitle = svc.title;
      }
    }

    const notifTitle =
      action === "accepted" ? "Work accepted!" :
      action === "rejected" ? "Submission rejected — refund review pending" :
      "Revision requested";
    const notifBody =
      action === "accepted"
        ? `Your delivery for "${contextTitle}" has been accepted!`
        : action === "rejected"
        ? `Your submission for "${contextTitle}" was rejected.${buyerNote ? ` Reason: ${buyerNote}` : ""} Admin will review the refund request and make a decision.`
        : `The buyer requested a revision for "${contextTitle}".${buyerNote ? ` Note: ${buyerNote}` : ""}`;

    const link = submission.type === "order" ? `/freelancer/orders/${submission.serviceOrderId}` : "/freelancer/hired";
    const notifId = crypto.randomUUID();
    await triggerNotification(submission.freelancerId, { id: notifId, title: notifTitle, body: notifBody, link });

    revalidatePath("/submitted-work");
    revalidatePath("/freelancer/hired");
    if (submission.serviceOrderId) revalidatePath(`/freelancer/orders/${submission.serviceOrderId}`);
    return { success: true };
  } catch (error) {
    console.error("reviewSubmissionAction error:", error);
    return { success: false, error: "Failed to review submission. Please try again." };
  }
}
