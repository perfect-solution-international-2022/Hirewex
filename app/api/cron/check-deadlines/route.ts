import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  projects, serviceOrders, projectSubmissions,
  refundRequests, notifications, freelancerServices, bids, jobs,
} from "@/drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import Pusher from "pusher";
import { getServiceFeePercent } from "@/app/actions/platform-settings";
import {
  getUserEmail,
  emailFreelancerDeadlineWarning,
  emailBuyerApprovalWindowClosing,
  emailAdminNewRefundRequest,
  emailAdminAutoApproved,
  emailAdminLateDelivery,
} from "@/lib/email";

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
  let flagged = 0, autoApproved = 0, warned = 0;

  // ── Existing refund IDs (avoid duplicates) ─────────────────────────────────
  const existingRefunds = await db
    .select({ projectId: refundRequests.projectId, serviceOrderId: refundRequests.serviceOrderId })
    .from(refundRequests)
    .where(inArray(refundRequests.status, ["pending", "approved"]));

  const refundedProjects = new Set(existingRefunds.map(r => r.projectId).filter(Boolean) as string[]);
  const refundedOrders   = new Set(existingRefunds.map(r => r.serviceOrderId).filter(Boolean) as string[]);

  // ── 1. Late project deliveries ─────────────────────────────────────────────
  const activeProjects = await db
    .select({ project: projects, deliveryDays: bids.deliveryDays, jobTitle: jobs.title })
    .from(projects)
    .leftJoin(bids, eq(projects.bidId, bids.id))
    .leftJoin(jobs, eq(projects.jobId, jobs.id))
    .where(eq(projects.status, "active"));

  for (const { project, deliveryDays, jobTitle } of activeProjects) {
    if (!project.startedAt || !deliveryDays) continue;
    if (refundedProjects.has(project.id)) continue;

    const elapsed = daysSince(project.startedAt);
    const grace   = gracePeriod(deliveryDays);
    const title   = jobTitle ?? "your project";

    if (elapsed >= grace) {
      // Flag for refund
      const refundAmount = Number(project.amount);
      const feePart = +(refundAmount * feeRate).toFixed(2);

      await db.insert(refundRequests).values({
        id: crypto.randomUUID(),
        type: "late_delivery",
        projectId: project.id,
        buyerId: project.buyerId,
        freelancerId: project.freelancerId,
        reason: `Freelancer did not submit work within the agreed ${deliveryDays}-day deadline. The ${grace}-day refund window has elapsed.`,
        refundAmount: refundAmount.toFixed(2),
        serviceFeeRetained: feePart.toFixed(2),
      });
      await db.update(projects).set({ status: "disputed" }).where(eq(projects.id, project.id));

      await pushNotif(project.buyerId,
        "Refund Flagged for Admin Review",
        `Your project "${title}" was flagged for a refund due to non-delivery within ${deliveryDays} days.`,
        "/submitted-work"
      );
      await pushNotif(project.freelancerId,
        "Project Disputed — Refund Requested",
        `A refund was requested for "${title}" due to failure to deliver within ${deliveryDays} days.`,
        "/freelancer/hired"
      );

      const [buyer, freelancer] = await Promise.all([
        getUserEmail(project.buyerId),
        getUserEmail(project.freelancerId),
      ]);
      await emailAdminLateDelivery({
        contextTitle: title,
        freelancerName: freelancer?.name ?? "Unknown",
        buyerName: buyer?.name ?? "Unknown",
        refundAmount: refundAmount.toFixed(2),
        deliveryDays,
      });
      await emailAdminNewRefundRequest({
        type: "late_delivery",
        contextTitle: title,
        buyerName: buyer?.name ?? "Unknown",
        freelancerName: freelancer?.name ?? "Unknown",
        refundAmount: refundAmount.toFixed(2),
        reason: `Freelancer did not submit work within the ${deliveryDays}-day deadline. Grace period: ${grace} days.`,
      });

      flagged++;
    } else if (elapsed >= grace - 2 && elapsed < grace - 1) {
      // 2 days before grace period expires — warn freelancer
      const daysLeft = Math.ceil(grace - elapsed);
      const freelancer = await getUserEmail(project.freelancerId);
      if (freelancer) {
        await emailFreelancerDeadlineWarning(
          freelancer.email, freelancer.name,
          title, daysLeft, "/freelancer/hired",
        );
      }
      warned++;
    }
  }

  // ── 2. Late service order deliveries ──────────────────────────────────────
  const paidOrders = await db
    .select({
      order: serviceOrders,
      packages: freelancerServices.packages,
      serviceTitle: freelancerServices.title,
    })
    .from(serviceOrders)
    .leftJoin(freelancerServices, eq(serviceOrders.serviceId, freelancerServices.id))
    .where(eq(serviceOrders.status, "paid"));

  const activeSubOrderIds = new Set(
    (await db
      .select({ id: projectSubmissions.serviceOrderId })
      .from(projectSubmissions)
      .where(inArray(projectSubmissions.status, ["pending", "accepted"]))
    ).map(r => r.id).filter(Boolean) as string[]
  );

  for (const { order, packages, serviceTitle } of paidOrders) {
    if (refundedOrders.has(order.id)) continue;
    if (activeSubOrderIds.has(order.id)) continue;

    const pkgs = packages as Record<string, { deliveryDays?: number }> | null;
    const deliveryDays = pkgs?.[order.tier]?.deliveryDays;
    if (!deliveryDays) continue;

    const elapsed = daysSince(order.createdAt);
    const grace   = gracePeriod(deliveryDays);
    const title   = serviceTitle ?? "service order";

    if (elapsed >= grace) {
      const refundAmount = Number(order.price);
      const feePart = +(refundAmount * feeRate).toFixed(2);

      await db.insert(refundRequests).values({
        id: crypto.randomUUID(),
        type: "late_delivery",
        serviceOrderId: order.id,
        buyerId: order.buyerId,
        freelancerId: order.freelancerId,
        reason: `Freelancer did not submit work within the agreed ${deliveryDays}-day deadline for this service order. The ${grace}-day refund window has elapsed.`,
        refundAmount: refundAmount.toFixed(2),
        serviceFeeRetained: feePart.toFixed(2),
      });

      await pushNotif(order.buyerId,
        "Refund Flagged for Admin Review",
        `Your order "${title}" was flagged for a refund due to non-delivery within ${deliveryDays} days.`,
        "/submitted-work"
      );
      await pushNotif(order.freelancerId,
        "Order Disputed — Refund Requested",
        `A refund was requested for your order "${title}" due to failure to deliver within ${deliveryDays} days.`,
        "/freelancer/orders"
      );

      const [buyer, freelancer] = await Promise.all([
        getUserEmail(order.buyerId),
        getUserEmail(order.freelancerId),
      ]);
      await emailAdminLateDelivery({
        contextTitle: title,
        freelancerName: freelancer?.name ?? "Unknown",
        buyerName: buyer?.name ?? "Unknown",
        refundAmount: refundAmount.toFixed(2),
        deliveryDays,
      });
      await emailAdminNewRefundRequest({
        type: "late_delivery",
        contextTitle: title,
        buyerName: buyer?.name ?? "Unknown",
        freelancerName: freelancer?.name ?? "Unknown",
        refundAmount: refundAmount.toFixed(2),
        reason: `Freelancer did not deliver the service order within ${deliveryDays} days. Grace period: ${grace} days.`,
      });

      flagged++;
    } else if (elapsed >= grace - 2 && elapsed < grace - 1) {
      const daysLeft = Math.ceil(grace - elapsed);
      const freelancer = await getUserEmail(order.freelancerId);
      if (freelancer) {
        await emailFreelancerDeadlineWarning(
          freelancer.email, freelancer.name,
          title, daysLeft, `/freelancer/orders/${order.id}`,
        );
      }
      warned++;
    }
  }

  // ── 3. Auto-approve pending submissions older than 3 days ─────────────────
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
      "Your submitted work was automatically approved because the buyer did not review it within 3 days.",
      sub.type === "order" ? "/freelancer/orders" : "/freelancer/hired"
    );
    await pushNotif(sub.buyerId,
      "Submission Auto-Approved",
      "A submission was auto-approved because you did not review it within 3 days.",
      "/submitted-work"
    );

    // Resolve context title for admin email
    let contextTitle = "project";
    let amount = "0";
    if (sub.type === "project" && sub.projectId) {
      const [p] = await db.select({ amount: projects.amount, jobId: projects.jobId })
        .from(projects).where(eq(projects.id, sub.projectId)).limit(1);
      if (p) {
        amount = p.amount;
        const [j] = await db.select({ title: jobs.title }).from(jobs).where(eq(jobs.id, p.jobId)).limit(1);
        if (j) contextTitle = j.title;
      }
    } else if (sub.type === "order" && sub.serviceOrderId) {
      const [o] = await db.select({ price: serviceOrders.price, serviceId: serviceOrders.serviceId })
        .from(serviceOrders).where(eq(serviceOrders.id, sub.serviceOrderId)).limit(1);
      if (o) {
        amount = o.price;
        const [s] = await db.select({ title: freelancerServices.title })
          .from(freelancerServices).where(eq(freelancerServices.id, o.serviceId)).limit(1);
        if (s) contextTitle = s.title;
      }
    }

    const freelancer = await getUserEmail(sub.freelancerId);
    await emailAdminAutoApproved({
      contextTitle,
      freelancerName: freelancer?.name ?? "Unknown",
      amount,
    });

    autoApproved++;
  }

  // ── 4. Approval window closing in < 24 h (send buyer warning email) ────────
  // Pending submissions between 2 and 3 days old
  const warnEnd   = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 19).replace("T", " ");
  const warnStart = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 19).replace("T", " ");

  const approachingApproval = await db
    .select()
    .from(projectSubmissions)
    .where(and(
      eq(projectSubmissions.status, "pending"),
      sql`${projectSubmissions.createdAt} < ${warnEnd}`,
      sql`${projectSubmissions.createdAt} >= ${warnStart}`
    ));

  for (const sub of approachingApproval) {
    // Resolve context title
    let contextTitle = "your submission";
    if (sub.type === "project" && sub.projectId) {
      const [p] = await db.select({ jobId: projects.jobId }).from(projects)
        .where(eq(projects.id, sub.projectId)).limit(1);
      if (p) {
        const [j] = await db.select({ title: jobs.title }).from(jobs)
          .where(eq(jobs.id, p.jobId)).limit(1);
        if (j) contextTitle = j.title;
      }
    } else if (sub.type === "order" && sub.serviceOrderId) {
      const [o] = await db.select({ serviceId: serviceOrders.serviceId })
        .from(serviceOrders).where(eq(serviceOrders.id, sub.serviceOrderId)).limit(1);
      if (o) {
        const [s] = await db.select({ title: freelancerServices.title })
          .from(freelancerServices).where(eq(freelancerServices.id, o.serviceId)).limit(1);
        if (s) contextTitle = s.title;
      }
    }

    const buyer = await getUserEmail(sub.buyerId);
    if (buyer) {
      await emailBuyerApprovalWindowClosing(buyer.email, buyer.name, contextTitle);
    }
    await pushNotif(sub.buyerId,
      "Review window closing soon",
      `Your submission for "${contextTitle}" will be auto-approved in less than 24 hours if you don't act.`,
      "/submitted-work"
    );
  }

  return NextResponse.json({ success: true, flagged, autoApproved, warned, approachingApproval: approachingApproval.length });
}
