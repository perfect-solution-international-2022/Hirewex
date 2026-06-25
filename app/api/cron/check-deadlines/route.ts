import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  projects, serviceOrders, projectSubmissions,
  refundRequests, notifications, freelancerServices, bids,
} from "@/drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import Pusher from "pusher";
import { getServiceFeePercent } from "@/app/actions/platform-settings";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

function gracePeriod(deliveryDays: number): number {
  if (deliveryDays <= 7) return 14;
  if (deliveryDays <= 14) return 20;
  return deliveryDays + 7;
}

function daysSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / 86_400_000;
}

function nowStr(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

async function pushNotif(userId: string, title: string, body: string, link: string) {
  const id = crypto.randomUUID();
  await db.insert(notifications).values({ id, userId, title, body, link, read: 0 });
  try { await pusher.trigger(`user-${userId}`, "notification", { id, title, body, link }); } catch {}
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feeRate = (await getServiceFeePercent()) / 100;
  let flagged = 0;
  let autoApproved = 0;

  // ── Existing refund project/order IDs (avoid duplicates) ──────────────────
  const existingRefunds = await db
    .select({ projectId: refundRequests.projectId, serviceOrderId: refundRequests.serviceOrderId })
    .from(refundRequests)
    .where(inArray(refundRequests.status, ["pending", "approved"]));

  const refundedProjects = new Set(existingRefunds.map(r => r.projectId).filter(Boolean) as string[]);
  const refundedOrders   = new Set(existingRefunds.map(r => r.serviceOrderId).filter(Boolean) as string[]);

  // ── 1. Late project deliveries (job bids) ─────────────────────────────────
  const activeProjects = await db
    .select({ project: projects, deliveryDays: bids.deliveryDays })
    .from(projects)
    .leftJoin(bids, eq(projects.bidId, bids.id))
    .where(eq(projects.status, "active"));

  for (const { project, deliveryDays } of activeProjects) {
    if (!project.startedAt || !deliveryDays) continue;
    if (refundedProjects.has(project.id)) continue;
    if (daysSince(project.startedAt) < gracePeriod(deliveryDays)) continue;

    const refundAmount = Number(project.amount);
    const feePart      = +(refundAmount * feeRate).toFixed(2);
    const grace        = gracePeriod(deliveryDays);

    await db.insert(refundRequests).values({
      id: crypto.randomUUID(),
      type: "late_delivery",
      projectId: project.id,
      buyerId: project.buyerId,
      freelancerId: project.freelancerId,
      reason: `Freelancer did not submit work within the agreed ${deliveryDays}-day deadline. The ${grace}-day refund window has now elapsed.`,
      refundAmount: refundAmount.toFixed(2),
      serviceFeeRetained: feePart.toFixed(2),
    });

    await db.update(projects).set({ status: "disputed" }).where(eq(projects.id, project.id));

    await pushNotif(project.buyerId,
      "Refund Flagged for Admin Review",
      `Your project was flagged for a refund because the freelancer did not deliver within ${deliveryDays} days. Admin will process this shortly.`,
      "/submitted-work"
    );
    await pushNotif(project.freelancerId,
      "Project Disputed — Refund Requested",
      `A refund has been requested for one of your projects due to failure to deliver within ${deliveryDays} days.`,
      "/freelancer/hired"
    );

    flagged++;
  }

  // ── 2. Late service order deliveries ──────────────────────────────────────
  const paidOrders = await db
    .select({ order: serviceOrders, packages: freelancerServices.packages })
    .from(serviceOrders)
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .where(eq(serviceOrders.status, "paid"));

  // Orders with an active (pending/accepted) submission — skip these
  const activeSubOrderIds = new Set(
    (await db
      .select({ id: projectSubmissions.serviceOrderId })
      .from(projectSubmissions)
      .where(inArray(projectSubmissions.status, ["pending", "accepted"]))
    ).map(r => r.id).filter(Boolean) as string[]
  );

  for (const { order, packages } of paidOrders) {
    if (refundedOrders.has(order.id)) continue;
    if (activeSubOrderIds.has(order.id)) continue;

    const pkgs        = packages as Record<string, { deliveryDays?: number }> | null;
    const deliveryDays = pkgs?.[order.tier]?.deliveryDays;
    if (!deliveryDays) continue;

    if (daysSince(order.createdAt) < gracePeriod(deliveryDays)) continue;

    const refundAmount = Number(order.price);
    const feePart      = +(refundAmount * feeRate).toFixed(2);
    const grace        = gracePeriod(deliveryDays);

    await db.insert(refundRequests).values({
      id: crypto.randomUUID(),
      type: "late_delivery",
      serviceOrderId: order.id,
      buyerId: order.buyerId,
      freelancerId: order.freelancerId,
      reason: `Freelancer did not submit work within the agreed ${deliveryDays}-day deadline for this service order. The ${grace}-day refund window has now elapsed.`,
      refundAmount: refundAmount.toFixed(2),
      serviceFeeRetained: feePart.toFixed(2),
    });

    await pushNotif(order.buyerId,
      "Refund Flagged for Admin Review",
      `Your service order was flagged for a refund because the freelancer did not deliver within ${deliveryDays} days.`,
      "/submitted-work"
    );
    await pushNotif(order.freelancerId,
      "Order Disputed — Refund Requested",
      `A refund has been requested for one of your service orders due to failure to deliver within ${deliveryDays} days.`,
      "/freelancer/orders"
    );

    flagged++;
  }

  // ── 3. Auto-approve submissions older than 3 days ─────────────────────────
  const cutoff = new Date(Date.now() - 3 * 86_400_000)
    .toISOString().slice(0, 19).replace("T", " ");

  const stalePending = await db
    .select()
    .from(projectSubmissions)
    .where(and(
      eq(projectSubmissions.status, "pending"),
      sql`${projectSubmissions.createdAt} < ${cutoff}`
    ));

  for (const sub of stalePending) {
    await db.update(projectSubmissions)
      .set({ status: "accepted", buyerNote: "Auto-approved: buyer did not review within 3 days." })
      .where(eq(projectSubmissions.id, sub.id));

    if (sub.projectId) {
      await db.update(projects)
        .set({ status: "completed", completedAt: nowStr() })
        .where(eq(projects.id, sub.projectId));
    }

    await pushNotif(sub.freelancerId,
      "Work Auto-Approved",
      "Your submitted work was automatically approved because the buyer did not review it within 3 days. Admin will now release your payment.",
      sub.type === "order" ? "/freelancer/orders" : "/freelancer/hired"
    );
    await pushNotif(sub.buyerId,
      "Submission Auto-Approved",
      "A submission was auto-approved because you did not review it within 3 days. Contact support if you have concerns.",
      "/submitted-work"
    );

    autoApproved++;
  }

  return NextResponse.json({ success: true, flagged, autoApproved });
}
