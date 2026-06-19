"use server";

import Pusher from "pusher";
import { db } from "@/lib/db";
import { users, kycApplications } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob"; // <-- 1. Import 'del'

// Helper to ensure only admins can run these actions
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized. Admins only.");
  }
}

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: "ap2",
  useTLS: true,
});

export async function approveKyc(applicationId: string, userId: string) {
  await requireAdmin();

  await db.update(kycApplications)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(kycApplications.id, applicationId));

  await db.update(users)
    .set({ kycStatus: "approved" })
    .where(eq(users.id, userId));

    await pusher.trigger(`user-${userId}`, "kyc-approved", {
    message: "Your account is now unlocked!"
  });

  revalidatePath("/admin/kyc");
  return { success: true };
}

export async function rejectKyc(applicationId: string, userId: string, reason: string) {
  await requireAdmin();

  if (!reason.trim()) throw new Error("A rejection reason is required.");

  // --- NEW: Delete images from Vercel Blob ---
  
  // 1. Fetch the application to get the image URLs
  const [app] = await db.select().from(kycApplications).where(eq(kycApplications.id, applicationId));
  
  if (app) {
    // 2. Gather all URLs that exist
    const urlsToDelete = [app.frontIdUrl, app.selfieUrl];
    if (app.backIdUrl) {
      urlsToDelete.push(app.backIdUrl);
    }
    
    // 3. Delete them from Vercel Blob
    try {
      await del(urlsToDelete);
    } catch (error) {
      console.error("Failed to delete images from Vercel Blob:", error);
      // We log the error but don't throw, so the database rejection still goes through
    }
  }

  // --- Proceed with standard rejection logic ---

  // 1. Mark application as rejected with the reason
  await db.update(kycApplications)
    .set({ status: "rejected", reviewedAt: new Date(), rejectionReason: reason })
    .where(eq(kycApplications.id, applicationId));

  // 2. Mark the user account as rejected
  await db.update(users)
    .set({ kycStatus: "rejected" })
    .where(eq(users.id, userId));

  revalidatePath("/admin/kyc");
  return { success: true };
}