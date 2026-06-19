"use server";

import { db } from "@/lib/db";
import { jobs } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    throw new Error("Unauthorized. Admins only.");
  }
}

export async function approveJob(jobId: string) {
  await requireAdmin();
  await db
    .update(jobs)
    .set({ approvalStatus: "approved", adminNote: null })
    .where(eq(jobs.id, jobId));
  revalidatePath("/admin/job-approval");
  revalidatePath("/my-projects");
}

export async function denyJob(jobId: string) {
  await requireAdmin();
  await db
    .update(jobs)
    .set({ approvalStatus: "denied", adminNote: null })
    .where(eq(jobs.id, jobId));
  revalidatePath("/admin/job-approval");
  revalidatePath("/my-projects");
}

export async function requestJobModification(jobId: string, note: string) {
  await requireAdmin();
  if (!note.trim()) throw new Error("A modification note is required.");
  await db
    .update(jobs)
    .set({ approvalStatus: "requires_modification", adminNote: note })
    .where(eq(jobs.id, jobId));
  revalidatePath("/admin/job-approval");
  revalidatePath("/my-projects");
}
