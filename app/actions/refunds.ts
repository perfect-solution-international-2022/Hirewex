"use server";

import { db } from "@/lib/db";
import {
  refundRequests, notifications, projects, jobs,
  serviceOrders, freelancerServices,
} from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Pusher from "pusher";
import {
  getUserEmail,
  emailBuyerRefundApproved,
  emailBuyerRefundRejected,
  emailFreelancerRefundApproved,
  emailFreelancerRefundRejected,
} from "@/lib/email";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) throw new Error("Admins only.");
  return session;
}

async function pushNotif(userId: string, title: string, body: string, link: string) {
  const id = crypto.randomUUID();
  await db.insert(notifications).values({ id, userId, title, body, link, read: 0 });
  try { await pusher.trigger(`user-${userId}`, "notification", { id, title, body, link }); } catch {}
}

function nowStr() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function getContextTitle(refund: {
  projectId: string | null;
  serviceOrderId: string | null;
}): Promise<string> {
  if (refund.projectId) {
    const [proj] = await db.select({ jobId: projects.jobId })
      .from(projects).where(eq(projects.id, refund.projectId)).limit(1);
    if (proj) {
      const [job] = await db.select({ title: jobs.title })
        .from(jobs).where(eq(jobs.id, proj.jobId)).limit(1);
      if (job) return job.title;
    }
  } else if (refund.serviceOrderId) {
    const [ord] = await db.select({ serviceId: serviceOrders.serviceId })
      .from(serviceOrders).where(eq(serviceOrders.id, refund.serviceOrderId)).limit(1);
    if (ord) {
      const [svc] = await db.select({ title: freelancerServices.title })
        .from(freelancerServices).where(eq(freelancerServices.id, ord.serviceId)).limit(1);
      if (svc) return svc.title;
    }
  }
  return "your order";
}

export async function approveRefund(refundId: string, adminNote?: string) {
  await requireAdmin();

  const [refund] = await db
    .select().from(refundRequests).where(eq(refundRequests.id, refundId)).limit(1);

  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "pending") throw new Error("This request has already been processed.");

  await db.update(refundRequests)
    .set({ status: "approved", processedAt: nowStr(), adminNote: adminNote || null })
    .where(eq(refundRequests.id, refundId));

  const refundAmt = Number(refund.refundAmount).toFixed(2);
  const feeAmt    = Number(refund.serviceFeeRetained).toFixed(2);
  const contextTitle = await getContextTitle(refund);

  await pushNotif(
    refund.buyerId, "Refund Approved",
    `Your refund of $${refundAmt} has been approved. Service fee of $${feeAmt} is non-refundable.`,
    "/submitted-work"
  );
  await pushNotif(
    refund.freelancerId, "Refund Processed",
    `A refund of $${refundAmt} was issued to the buyer for "${contextTitle}".`,
    "/freelancer/hired"
  );

  // Emails
  const [buyer, freelancer] = await Promise.all([
    getUserEmail(refund.buyerId),
    getUserEmail(refund.freelancerId),
  ]);
  if (buyer) {
    await emailBuyerRefundApproved(
      buyer.email, buyer.name,
      contextTitle, refundAmt, feeAmt,
    );
  }
  if (freelancer) {
    await emailFreelancerRefundApproved(
      freelancer.email, freelancer.name,
      contextTitle, refundAmt, adminNote,
    );
  }

  revalidatePath("/admin/refunds");
}

export async function rejectRefund(refundId: string, adminNote: string) {
  await requireAdmin();

  const [refund] = await db
    .select().from(refundRequests).where(eq(refundRequests.id, refundId)).limit(1);

  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "pending") throw new Error("This request has already been processed.");

  await db.update(refundRequests)
    .set({ status: "rejected", processedAt: nowStr(), adminNote })
    .where(eq(refundRequests.id, refundId));

  const contextTitle = await getContextTitle(refund);

  await pushNotif(
    refund.buyerId, "Refund Request Rejected",
    `Your refund request was reviewed and rejected. Reason: ${adminNote}`,
    "/submitted-work"
  );
  await pushNotif(
    refund.freelancerId, "Refund Request Rejected",
    `The refund request on your order was reviewed and rejected by admin.`,
    "/freelancer/hired"
  );

  // Emails
  const [buyer, freelancer] = await Promise.all([
    getUserEmail(refund.buyerId),
    getUserEmail(refund.freelancerId),
  ]);
  if (buyer) {
    await emailBuyerRefundRejected(buyer.email, buyer.name, contextTitle, adminNote);
  }
  if (freelancer) {
    await emailFreelancerRefundRejected(freelancer.email, freelancer.name, contextTitle, adminNote);
  }

  revalidatePath("/admin/refunds");
}
