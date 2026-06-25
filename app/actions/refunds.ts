"use server";

import { db } from "@/lib/db";
import { refundRequests, notifications } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Pusher from "pusher";

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

export async function approveRefund(refundId: string, adminNote?: string) {
  await requireAdmin();

  const [refund] = await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.id, refundId))
    .limit(1);

  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "pending") throw new Error("This request has already been processed.");

  await db.update(refundRequests)
    .set({ status: "approved", processedAt: nowStr(), adminNote: adminNote || null })
    .where(eq(refundRequests.id, refundId));

  const refundAmt = Number(refund.refundAmount).toFixed(2);
  const feeAmt    = Number(refund.serviceFeeRetained).toFixed(2);

  await pushNotif(
    refund.buyerId,
    "Refund Approved",
    `Your refund of $${refundAmt} has been approved. The service fee of $${feeAmt} is non-refundable. You will receive the funds via your original payment method.`,
    "/submitted-work"
  );
  await pushNotif(
    refund.freelancerId,
    "Refund Processed",
    `A refund of $${refundAmt} has been issued to the buyer for an order where work was not delivered. Please ensure timely delivery on future orders.`,
    "/freelancer/hired"
  );

  revalidatePath("/admin/refunds");
}

export async function rejectRefund(refundId: string, adminNote: string) {
  await requireAdmin();

  const [refund] = await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.id, refundId))
    .limit(1);

  if (!refund) throw new Error("Refund request not found.");
  if (refund.status !== "pending") throw new Error("This request has already been processed.");

  await db.update(refundRequests)
    .set({ status: "rejected", processedAt: nowStr(), adminNote })
    .where(eq(refundRequests.id, refundId));

  await pushNotif(
    refund.buyerId,
    "Refund Request Rejected",
    `Your refund request has been reviewed and rejected by admin. Reason: ${adminNote}`,
    "/submitted-work"
  );
  await pushNotif(
    refund.freelancerId,
    "Refund Request Rejected",
    `The refund request on your order was reviewed and rejected by admin.`,
    "/freelancer/hired"
  );

  revalidatePath("/admin/refunds");
}
