"use server";

import { db } from "@/lib/db";
import { notifications } from "@/drizzle/schema";
import { auth } from "@/auth";
import { eq, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized", data: [] };

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return { success: true, data: items };
  } catch (error) {
    console.error("getNotifications error:", error);
    return { success: false, error: "Failed to load notifications.", data: [] };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await db
      .update(notifications)
      .set({ read: 1 })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));

    return { success: true };
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return { success: false, error: "Failed to update notification." };
  }
}

export async function markAllNotificationsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await db
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.userId, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return { success: false, error: "Failed to update notifications." };
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));

    return { success: true };
  } catch (error) {
    console.error("deleteNotification error:", error);
    return { success: false, error: "Failed to delete notification." };
  }
}

export async function deleteNotifications(notificationIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };
    if (notificationIds.length === 0) return { success: true };

    await db
      .delete(notifications)
      .where(and(eq(notifications.userId, session.user.id), inArray(notifications.id, notificationIds)));

    return { success: true };
  } catch (error) {
    console.error("deleteNotifications error:", error);
    return { success: false, error: "Failed to delete notifications." };
  }
}
