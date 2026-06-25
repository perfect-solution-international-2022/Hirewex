"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { reviews, profiles, projects, serviceOrders } from "@/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/auth";

export async function submitReviewAction(data: {
  projectId?: string;
  serviceOrderId?: string;
  revieweeId: string;
  rating: number;
  comment: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    const reviewerId = session.user.id;

    const { projectId, serviceOrderId, revieweeId, rating, comment } = data;

    if (!projectId && !serviceOrderId) return { success: false, error: "Missing context" };
    if (rating < 1 || rating > 5) return { success: false, error: "Rating must be between 1 and 5" };

    // Verify reviewer is the buyer for this project/order
    if (projectId) {
      const [proj] = await db.select({ buyerId: projects.buyerId })
        .from(projects).where(eq(projects.id, projectId)).limit(1);
      if (!proj || proj.buyerId !== reviewerId) return { success: false, error: "Unauthorized" };
    } else if (serviceOrderId) {
      const [order] = await db.select({ buyerId: serviceOrders.buyerId })
        .from(serviceOrders).where(eq(serviceOrders.id, serviceOrderId)).limit(1);
      if (!order || order.buyerId !== reviewerId) return { success: false, error: "Unauthorized" };
    }

    // Check for duplicate (handle gracefully)
    if (projectId) {
      const [existing] = await db.select({ id: reviews.id }).from(reviews)
        .where(and(eq(reviews.projectId, projectId), eq(reviews.reviewerId, reviewerId))).limit(1);
      if (existing) return { success: false, error: "You have already reviewed this project" };
    } else if (serviceOrderId) {
      const [existing] = await db.select({ id: reviews.id }).from(reviews)
        .where(and(eq(reviews.serviceOrderId, serviceOrderId), eq(reviews.reviewerId, reviewerId))).limit(1);
      if (existing) return { success: false, error: "You have already reviewed this order" };
    }

    // Insert review
    await db.insert(reviews).values({
      projectId: projectId || null,
      serviceOrderId: serviceOrderId || null,
      reviewerId,
      revieweeId,
      rating,
      comment: comment.trim() || null,
    });

    // Recalculate and update profile rating
    const [{ avg, total }] = await db
      .select({
        avg:   sql<number>`COALESCE(AVG(rating), 0)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(eq(reviews.revieweeId, revieweeId));

    await db.insert(profiles)
      .values({
        id:           revieweeId,
        rating:       Number(avg).toFixed(2),
        totalReviews: Number(total),
      })
      .onDuplicateKeyUpdate({
        set: {
          rating:       Number(avg).toFixed(2),
          totalReviews: Number(total),
        },
      });

    revalidatePath("/submitted-work");
    revalidatePath("/service");
    return { success: true };
  } catch (error) {
    console.error("submitReviewAction error:", error);
    return { success: false, error: "Failed to submit review. Please try again." };
  }
}

export async function getMyReviewedIds(buyerId: string) {
  const rows = await db
    .select({ projectId: reviews.projectId, serviceOrderId: reviews.serviceOrderId })
    .from(reviews)
    .where(eq(reviews.reviewerId, buyerId));
  const projectIds = new Set(rows.map((r) => r.projectId).filter(Boolean) as string[]);
  const orderIds   = new Set(rows.map((r) => r.serviceOrderId).filter(Boolean) as string[]);
  return { projectIds: [...projectIds], orderIds: [...orderIds] };
}
